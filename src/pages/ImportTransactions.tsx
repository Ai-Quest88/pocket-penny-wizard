
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

  const batchUpdateAccountBalances = async (transactions: Omit<Transaction, 'id'>[]) => {
    try {
      console.log('Starting batch account balance updates for', transactions.length, 'transactions');
      
      // Group transactions by account for batch processing
      const accountTransactions = new Map<string, number>();
      
      transactions.forEach(transaction => {
        if (transaction.account && transaction.account !== 'Default Account' && transaction.account.trim() !== '') {
          const currentAmount = accountTransactions.get(transaction.account) || 0;
          accountTransactions.set(transaction.account, currentAmount + transaction.amount);
        }
      });

      console.log('Batched updates by account:', Array.from(accountTransactions.entries()));

      if (accountTransactions.size === 0) {
        console.log('No account updates needed');
        return { successCount: 0, failedCount: 0, errors: [] };
      }

      // Fetch all assets and liabilities once
      const [assetsResponse, liabilitiesResponse] = await Promise.all([
        supabase
          .from('assets')
          .select(`id, name, value, entities!inner(name)`)
          .eq('user_id', session!.user.id)
          .eq('type', 'cash'),
        supabase
          .from('liabilities')
          .select(`id, name, amount, entities!inner(name)`)
          .eq('user_id', session!.user.id)
      ]);

      if (assetsResponse.error) {
        console.error('Error fetching assets:', assetsResponse.error);
        throw new Error('Failed to fetch assets');
      }

      if (liabilitiesResponse.error) {
        console.error('Error fetching liabilities:', liabilitiesResponse.error);
        throw new Error('Failed to fetch liabilities');
      }

      const assets = assetsResponse.data || [];
      const liabilities = liabilitiesResponse.data || [];

      console.log('Fetched assets and liabilities for batch processing');

      // Process each account's batch update
      const updatePromises = Array.from(accountTransactions.entries()).map(async ([accountInfo, totalAmount]) => {
        try {
          console.log(`Processing batch update for ${accountInfo}: ${totalAmount}`);
          
          // Parse account info: "Account Name - Entity Name (accountType)"
          const accountParts = accountInfo.split(' - ');
          if (accountParts.length < 2) {
            throw new Error(`Invalid account format: ${accountInfo}`);
          }

          const accountName = accountParts[0].trim();
          const entityAndType = accountParts[1];
          const isAsset = entityAndType.includes('(asset)');
          const isLiability = entityAndType.includes('(liability)');
          
          if (!isAsset && !isLiability) {
            throw new Error(`Could not determine account type from: ${accountInfo}`);
          }

          const entityName = entityAndType.split(' (')[0].trim();

          if (isAsset) {
            // Find matching asset
            let matchingAsset = assets.find(asset => 
              asset.name.toLowerCase() === accountName.toLowerCase() && 
              asset.entities.name.toLowerCase() === entityName.toLowerCase()
            );

            if (!matchingAsset) {
              matchingAsset = assets.find(asset => 
                asset.name.toLowerCase().includes(accountName.toLowerCase()) ||
                accountName.toLowerCase().includes(asset.name.toLowerCase())
              );
            }

            if (!matchingAsset) {
              throw new Error(`No matching asset found for: ${accountName}`);
            }

            const currentValue = Number(matchingAsset.value) || 0;
            const newBalance = currentValue + totalAmount;
            
            console.log(`Updating asset ${matchingAsset.name} from ${currentValue} to ${newBalance} (change: ${totalAmount})`);
            
            const { error: updateError } = await supabase
              .from('assets')
              .update({ 
                value: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingAsset.id);

            if (updateError) {
              throw new Error(`Failed to update ${matchingAsset.name}: ${updateError.message}`);
            }

            return { success: true, account: accountName, newBalance };

          } else if (isLiability) {
            // Find matching liability
            let matchingLiability = liabilities.find(liability => 
              liability.name.toLowerCase() === accountName.toLowerCase() && 
              liability.entities.name.toLowerCase() === entityName.toLowerCase()
            );

            if (!matchingLiability) {
              matchingLiability = liabilities.find(liability => 
                liability.name.toLowerCase().includes(accountName.toLowerCase()) ||
                accountName.toLowerCase().includes(liability.name.toLowerCase())
              );
            }

            if (!matchingLiability) {
              throw new Error(`No matching liability found for: ${accountName}`);
            }

            const currentAmount = Number(matchingLiability.amount) || 0;
            const newBalance = currentAmount + Math.abs(totalAmount);
            
            console.log(`Updating liability ${matchingLiability.name} from ${currentAmount} to ${newBalance}`);
            
            const { error: updateError } = await supabase
              .from('liabilities')
              .update({ 
                amount: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingLiability.id);

            if (updateError) {
              throw new Error(`Failed to update ${matchingLiability.name}: ${updateError.message}`);
            }

            return { success: true, account: accountName, newBalance };
          }
        } catch (error) {
          console.error(`Failed to update ${accountInfo}:`, error);
          return { success: false, account: accountInfo, error: error.message };
        }
      });

      // Execute all updates in parallel
      const results = await Promise.all(updatePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      const errors = results.filter(r => !r.success).map(r => r.error);

      console.log(`Batch update completed: ${successCount} successful, ${failedCount} failed`);
      
      return { successCount, failedCount, errors };

    } catch (error) {
      console.error('Error in batchUpdateAccountBalances:', error);
      throw error;
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

      console.log("Inserting transactions to database with AI categories:", transactionsForDb.length);

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

      console.log("Successfully inserted transactions:", data?.length);

      // Update account balances in batches
      toast({
        title: "Updating Balances",
        description: "Updating account balances...",
      });

      const updateResults = await batchUpdateAccountBalances(transactions);
      
      // Invalidate and refetch queries to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      // Provide detailed success message
      if (updateResults.failedCount > 0) {
        toast({
          title: "Partial Success",
          description: `Imported ${transactions.length} transactions. ${updateResults.successCount} account balances updated, ${updateResults.failedCount} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} and updated ${updateResults.successCount} account balances.`,
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
