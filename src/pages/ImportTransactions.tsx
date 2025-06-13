
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

  const updateAssetBalance = async (accountName: string, amount: number, entityName: string) => {
    try {
      // Find the asset by name and entity
      const { data: assets, error: findError } = await supabase
        .from('assets')
        .select(`
          id,
          value,
          entities!inner(name)
        `)
        .eq('user_id', session!.user.id)
        .eq('type', 'cash')
        .ilike('name', `%${accountName.split(' (')[0]}%`); // Remove entity info from account name

      if (findError) {
        console.error('Error finding asset:', findError);
        return;
      }

      // Filter by entity name if we have multiple matches
      const matchingAsset = assets?.find(asset => 
        asset.entities.name.toLowerCase().includes(entityName.toLowerCase()) ||
        entityName.toLowerCase().includes(asset.entities.name.toLowerCase())
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
      } else {
        console.warn(`Could not find matching asset for account: ${accountName}`);
      }
    } catch (error) {
      console.error('Error in updateAssetBalance:', error);
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

      // Update asset balances for each transaction
      toast({
        title: "Updating Balances",
        description: "Updating account balances...",
      });

      const balanceUpdates = transactions.map(async (transaction) => {
        if (transaction.account && transaction.account !== 'Default Account') {
          // Extract account name and entity from the account field
          const accountParts = transaction.account.split(' - ');
          const accountName = accountParts[0];
          const entityName = accountParts[1] || '';
          
          await updateAssetBalance(accountName, transaction.amount, entityName);
        }
      });

      await Promise.all(balanceUpdates);
      
      // Invalidate and refetch queries to update the UI immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
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
          Upload a CSV file to import your transactions. Transactions will be automatically categorized and account balances will be updated in your assets.
        </p>
      </div>
      
      <CsvUploadForm onTransactionsUploaded={handleTransactionsUploaded} />
    </div>
  );
}
