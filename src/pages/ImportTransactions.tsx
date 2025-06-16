
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

      // Get account mapping for account names to IDs
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, entities!inner(name)')
        .eq('user_id', session.user.id)
        .eq('type', 'cash');

      if (assetsError) {
        console.error('Error fetching assets for account mapping:', assetsError);
        throw assetsError;
      }

      // Prepare transactions for database insertion with AI categorization and account_id
      const transactionsForDb = transactions.map((transaction, index) => {
        // Find the matching account ID based on the account string
        let accountId = null;
        if (transaction.account && transaction.account !== 'Default Account') {
          const matchingAsset = assets.find(asset => 
            transaction.account.includes(asset.name) && 
            transaction.account.includes(asset.entities.name)
          );
          accountId = matchingAsset?.id || null;
        }

        return {
          user_id: session.user.id,
          description: transaction.description,
          amount: transaction.amount,
          category: categories[index] || 'Miscellaneous',
          date: transaction.date,
          currency: transaction.currency,
          comment: transaction.comment || null,
          account_id: accountId,
        };
      });

      console.log("Inserting transactions to database with AI categories and account IDs:", transactionsForDb.length);

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

      // Invalidate and refetch queries to update the UI with new dynamic balances
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      await queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      toast({
        title: "Success",
        description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}. Account balances will update automatically.`,
      });

      // Call the success callback to close the dialog
      console.log("Calling onSuccess callback to close dialog");
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
          Upload a CSV file to import your transactions. <strong>You must select an account</strong> from your Assets or Liabilities for all transactions to be properly imported. Account balances will be calculated automatically from your transactions.
        </p>
      </div>
      
      <CsvUploadForm onTransactionsUploaded={handleTransactionsUploaded} />
    </div>
  );
}
