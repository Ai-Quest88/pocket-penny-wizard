
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
      
      // Parse account info: "Account Name - Entity Name (accountType)"
      const accountParts = accountInfo.split(' - ');
      if (accountParts.length < 2) {
        console.warn('Invalid account format:', accountInfo);
        return;
      }

      const accountName = accountParts[0];
      const entityAndType = accountParts[1];
      const entityName = entityAndType.split(' (')[0];
      const accountType = entityAndType.includes('(asset)') ? 'asset' : 'liability';

      console.log('Parsed account info:', { accountName, entityName, accountType });

      if (accountType === 'asset') {
        // Update asset balance
        const { data: assets, error: findError } = await supabase
          .from('assets')
          .select(`
            id,
            value,
            entities!inner(name)
          `)
          .eq('user_id', session!.user.id)
          .eq('type', 'cash')
          .ilike('name', `%${accountName}%`);

        if (findError) {
          console.error('Error finding asset:', findError);
          return;
        }

        const matchingAsset = assets?.find(asset => 
          asset.entities.name.toLowerCase().includes(entityName.toLowerCase())
        ) || assets?.[0];

        if (matchingAsset) {
          const newBalance = Number(matchingAsset.value) + amount;
          
          const { error: updateError } = await supabase
            .from('assets')
            .update({ 
              value: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', matchingAsset.id);

          if (updateError) {
            console.error('Error updating asset balance:', updateError);
          } else {
            console.log(`Updated asset ${matchingAsset.id} balance by ${amount} to ${newBalance}`);
          }
        }
      } else if (accountType === 'liability') {
        // Update liability balance
        const { data: liabilities, error: findError } = await supabase
          .from('liabilities')
          .select(`
            id,
            amount,
            entities!inner(name)
          `)
          .eq('user_id', session!.user.id)
          .ilike('name', `%${accountName}%`);

        if (findError) {
          console.error('Error finding liability:', findError);
          return;
        }

        const matchingLiability = liabilities?.find(liability => 
          liability.entities.name.toLowerCase().includes(entityName.toLowerCase())
        ) || liabilities?.[0];

        if (matchingLiability) {
          // For liabilities, positive amounts increase the debt, negative amounts decrease it
          const newBalance = Number(matchingLiability.amount) + Math.abs(amount);
          
          const { error: updateError } = await supabase
            .from('liabilities')
            .update({ 
              amount: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', matchingLiability.id);

          if (updateError) {
            console.error('Error updating liability balance:', updateError);
          } else {
            console.log(`Updated liability ${matchingLiability.id} balance by ${Math.abs(amount)} to ${newBalance}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in updateAccountBalance:', error);
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

      // Update account balances for each transaction
      toast({
        title: "Updating Balances",
        description: "Updating account balances...",
      });

      const balanceUpdates = transactions.map(async (transaction) => {
        if (transaction.account && transaction.account !== 'Default Account') {
          await updateAccountBalance(transaction.account, transaction.amount);
        }
      });

      await Promise.all(balanceUpdates);
      
      // Invalidate and refetch queries to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      toast({
        title: "Success",
        description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} and updated account balances.`,
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
