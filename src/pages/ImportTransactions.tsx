
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
      
      // Skip if it's the default account or empty
      if (!accountInfo || accountInfo === 'Default Account' || accountInfo.trim() === '') {
        console.log('Skipping default/empty account balance update');
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
      
      // Check if this is an asset or liability
      const isAsset = entityAndType.includes('(asset)');
      const isLiability = entityAndType.includes('(liability)');
      
      if (!isAsset && !isLiability) {
        console.warn('Could not determine account type from:', accountInfo);
        return;
      }

      const entityName = entityAndType.split(' (')[0].trim();

      console.log('Parsed account info:', { accountName, entityName, isAsset, isLiability });

      if (isAsset) {
        // Find matching cash asset
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

        // Find exact match first
        let matchingAsset = assets?.find(asset => 
          asset.name.toLowerCase() === accountName.toLowerCase() && 
          asset.entities.name.toLowerCase() === entityName.toLowerCase()
        );

        if (!matchingAsset) {
          // Try partial name matching
          matchingAsset = assets?.find(asset => 
            asset.name.toLowerCase().includes(accountName.toLowerCase()) ||
            accountName.toLowerCase().includes(asset.name.toLowerCase())
          );
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
            throw new Error(`Failed to update ${matchingAsset.name} balance`);
          } else {
            console.log(`Successfully updated asset ${matchingAsset.name} balance to ${newBalance}`);
          }
        } else {
          console.warn('No matching asset found for:', accountName);
          throw new Error(`Could not find matching account for "${accountName}"`);
        }
      } else if (isLiability) {
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
          liability.entities.name.toLowerCase() === entityName.toLowerCase()
        );

        if (!matchingLiability) {
          matchingLiability = liabilities?.find(liability => 
            liability.name.toLowerCase().includes(accountName.toLowerCase()) ||
            accountName.toLowerCase().includes(liability.name.toLowerCase())
          );
        }

        if (matchingLiability) {
          const currentAmount = Number(matchingLiability.amount) || 0;
          const newBalance = currentAmount + Math.abs(amount);
          
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
            throw new Error(`Failed to update ${matchingLiability.name} balance`);
          } else {
            console.log(`Successfully updated liability ${matchingLiability.name} balance to ${newBalance}`);
          }
        } else {
          console.warn('No matching liability found for:', accountName);
          throw new Error(`Could not find matching account for "${accountName}"`);
        }
      }
    } catch (error) {
      console.error('Error in updateAccountBalance:', error);
      throw error; // Re-throw to be handled by caller
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

    // Validate that transactions have proper account associations
    const transactionsWithoutAccounts = transactions.filter(t => 
      !t.account || t.account === 'Default Account' || t.account.trim() === ''
    );

    if (transactionsWithoutAccounts.length > 0) {
      toast({
        title: "Account Selection Required",
        description: `${transactionsWithoutAccounts.length} transaction(s) don't have accounts selected. Please select an account for all transactions.`,
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
        category: categories[index] || 'Miscellaneous',
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

      // Update account balances for each transaction
      toast({
        title: "Updating Balances",
        description: "Updating account balances...",
      });

      let successfulUpdates = 0;
      let failedUpdates = 0;
      const failedAccounts: string[] = [];

      for (const transaction of transactions) {
        if (transaction.account && transaction.account !== 'Default Account') {
          try {
            await updateAccountBalance(transaction.account, transaction.amount);
            successfulUpdates++;
          } catch (error) {
            console.error(`Failed to update balance for ${transaction.account}:`, error);
            failedUpdates++;
            failedAccounts.push(transaction.account);
          }
        }
      }
      
      // Invalidate and refetch queries to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      // Provide detailed success message
      if (failedUpdates > 0) {
        toast({
          title: "Partial Success",
          description: `Imported ${transactions.length} transactions. ${successfulUpdates} account balances updated, ${failedUpdates} failed (${failedAccounts.join(', ')}).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} and updated ${successfulUpdates} account balances.`,
        });
      }

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
          Upload a CSV file to import your transactions. <strong>You must select an account</strong> from your Assets or Liabilities for all transactions to be properly imported and have balances updated.
        </p>
      </div>
      
      <CsvUploadForm onTransactionsUploaded={handleTransactionsUploaded} />
    </div>
  );
}
