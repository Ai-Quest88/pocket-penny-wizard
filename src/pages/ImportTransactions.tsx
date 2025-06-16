
import { CsvUploadForm } from "@/components/transaction-forms/CsvUploadForm";
import { Transaction } from "@/types/transaction-forms";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { categorizeBatchTransactions } from "@/utils/transactionCategories";
import { initializeAIClassifier } from "@/utils/aiCategorization";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

export default function ImportTransactions({ onSuccess }: ImportTransactionsProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Initialize AI classifier when component mounts
  useEffect(() => {
    initializeAIClassifier().catch(error => {
      console.warn('Failed to initialize AI classifier:', error);
    });
  }, []);

  const updateAccountBalance = async (accountInfo: string, amount: number) => {
    try {
      console.log('Updating account balance for:', accountInfo, 'with amount:', amount);
      
      // Skip if it's the default account
      if (!accountInfo || accountInfo === 'Default Account') {
        console.log('Skipping default account balance update');
        return;
      }

      // Parse account info: "Account Name - Entity Name (accountType)"
      const accountParts = accountInfo.split(' - ');
      if (accountParts.length < 2) {
        console.warn('Invalid account format:', accountInfo);
        return;
      }

      const accountName = accountParts[0].trim();
      const entityAndType = accountParts[1];
      const entityName = entityAndType.split(' (')[0].trim();
      const accountType = entityAndType.includes('(asset)') ? 'asset' : 'liability';

      console.log('Parsed account info:', { accountName, entityName, accountType });

      if (accountType === 'asset') {
        // Find matching cash asset with better matching logic
        const { data: assets, error: findError } = await supabase
          .from('assets')
          .select(`
            id,
            name,
            value,
            entities!inner(name)
          `)
          .eq('user_id', session!.user.id)
          .eq('type', 'cash');

        if (findError) {
          console.error('Error finding asset:', findError);
          return;
        }

        console.log('Found assets:', assets);

        // Improved matching logic - try exact name match first, then partial
        let matchingAsset = assets?.find(asset => 
          asset.name.toLowerCase() === accountName.toLowerCase() && 
          asset.entities.name.toLowerCase().includes(entityName.toLowerCase())
        );

        if (!matchingAsset) {
          // Try partial name matching
          matchingAsset = assets?.find(asset => 
            asset.name.toLowerCase().includes(accountName.toLowerCase()) ||
            accountName.toLowerCase().includes(asset.name.toLowerCase())
          );
        }

        if (!matchingAsset && assets && assets.length > 0) {
          // Fallback to first available cash asset
          matchingAsset = assets[0];
          console.log('Using fallback asset:', matchingAsset.name);
        }

        if (matchingAsset) {
          const currentValue = Number(matchingAsset.value) || 0;
          const newBalance = currentValue + amount;
          
          console.log(`Updating asset ${matchingAsset.name} from ${currentValue} to ${newBalance} (change: ${amount})`);
          
          const { error: updateError } = await supabase
            .from('assets')
            .update({ 
              value: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', matchingAsset.id);

          if (updateError) {
            console.error('Error updating asset balance:', updateError);
            toast({
              title: "Balance Update Warning",
              description: `Transaction saved but failed to update ${matchingAsset.name} balance.`,
              variant: "destructive",
            });
          } else {
            console.log(`Successfully updated asset ${matchingAsset.name} balance to ${newBalance}`);
          }
        } else {
          console.warn('No matching asset found for:', accountName);
          toast({
            title: "Account Not Found",
            description: `Could not find matching account for "${accountName}". Transaction saved but balance not updated.`,
            variant: "destructive",
          });
        }
      } else if (accountType === 'liability') {
        // Find matching liability
        const { data: liabilities, error: findError } = await supabase
          .from('liabilities')
          .select(`
            id,
            name,
            amount,
            entities!inner(name)
          `)
          .eq('user_id', session!.user.id);

        if (findError) {
          console.error('Error finding liability:', findError);
          return;
        }

        console.log('Found liabilities:', liabilities);

        let matchingLiability = liabilities?.find(liability => 
          liability.name.toLowerCase() === accountName.toLowerCase() && 
          liability.entities.name.toLowerCase().includes(entityName.toLowerCase())
        );

        if (!matchingLiability) {
          matchingLiability = liabilities?.find(liability => 
            liability.name.toLowerCase().includes(accountName.toLowerCase()) ||
            accountName.toLowerCase().includes(liability.name.toLowerCase())
          );
        }

        if (matchingLiability) {
          // For liabilities, we need to handle the amount correctly
          // Positive transaction amounts typically increase the debt
          const currentAmount = Number(matchingLiability.amount) || 0;
          const newBalance = currentAmount + Math.abs(amount); // Always add to debt
          
          console.log(`Updating liability ${matchingLiability.name} from ${currentAmount} to ${newBalance}`);
          
          const { error: updateError } = await supabase
            .from('liabilities')
            .update({ 
              amount: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', matchingLiability.id);

          if (updateError) {
            console.error('Error updating liability balance:', updateError);
            toast({
              title: "Balance Update Warning",
              description: `Transaction saved but failed to update ${matchingLiability.name} balance.`,
              variant: "destructive",
            });
          } else {
            console.log(`Successfully updated liability ${matchingLiability.name} balance to ${newBalance}`);
          }
        } else {
          console.warn('No matching liability found for:', accountName);
        }
      }
    } catch (error) {
      console.error('Error in updateAccountBalance:', error);
      toast({
        title: "Balance Update Error",
        description: "An error occurred while updating account balance.",
        variant: "destructive",
      });
    }
  };

  const handleTransactionsUploaded = async (transactions: Omit<Transaction, 'id'>[]) => {
    console.log("Transactions uploaded:", transactions);
    
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing",
        description: `Categorizing ${transactions.length} transactions with AI in batches...`,
      });

      // Extract descriptions for batch categorization
      const descriptions = transactions.map(t => t.description);
      
      // Process in batches with retry logic, now passing userId for database lookups
      const categories = await categorizeBatchTransactions(descriptions, session.user.id, 3, 2);

      // Prepare transactions for database insertion with AI categorization
      const transactionsForDb = transactions.map((transaction, index) => ({
        user_id: session.user.id,
        description: transaction.description,
        amount: transaction.amount,
        category: categories[index] || 'Miscellaneous', // Use batch result or fallback
        date: transaction.date,
        currency: transaction.currency,
        comment: transaction.comment || null,
      }));

      console.log("Inserting transactions to database with AI categories:", transactionsForDb);

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionsForDb)
        .select();

      if (error) {
        console.error('Error inserting transactions:', error);
        toast({
          title: "Error",
          description: `Failed to save transactions: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Successfully inserted transactions:", data);

      // Update account balances for each transaction with improved error handling
      toast({
        title: "Updating Balances",
        description: "Updating account balances...",
      });

      let successfulUpdates = 0;
      let failedUpdates = 0;

      const balanceUpdatePromises = transactions.map(async (transaction) => {
        if (transaction.account && transaction.account !== 'Default Account') {
          try {
            await updateAccountBalance(transaction.account, transaction.amount);
            successfulUpdates++;
          } catch (error) {
            console.error(`Failed to update balance for ${transaction.account}:`, error);
            failedUpdates++;
          }
        }
      });

      await Promise.allSettled(balanceUpdatePromises); // Use allSettled to handle partial failures
      
      // Invalidate and refetch queries to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      // Provide detailed success message
      const balanceMessage = failedUpdates > 0 
        ? ` (${successfulUpdates} account balances updated, ${failedUpdates} failed)`
        : ` and updated ${successfulUpdates} account balances`;

      toast({
        title: "Success",
        description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}${balanceMessage}.`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving transactions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving transactions.",
        variant: "destructive",
      });
    }
  };

  console.log("ImportTransactions component rendering");

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Import Transactions</h2>
        <p className="text-muted-foreground">
          Upload a CSV file to import your transactions. Select an account from your Assets or Liabilities, and transactions will be automatically categorized with account balances updated accordingly.
        </p>
      </div>
      
      <CsvUploadForm onTransactionsUploaded={handleTransactionsUploaded} />
    </div>
  );
}
