
import { CsvUploadForm } from "@/components/transaction-forms/CsvUploadForm";
import { Transaction } from "@/types/transaction-forms";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { categorizeTransaction, initializeAIClassifier } from "@/utils/transactionCategories";
import { useEffect } from "react";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

export default function ImportTransactions({ onSuccess }: ImportTransactionsProps) {
  const { toast } = useToast();
  const { session } = useAuth();

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

    try {
      toast({
        title: "Processing",
        description: "Categorizing transactions with AI...",
      });

      // Prepare transactions for database insertion with AI categorization
      const transactionsForDb = await Promise.all(
        transactions.map(async (transaction) => ({
          user_id: session.user.id,
          description: transaction.description,
          amount: transaction.amount,
          category: await categorizeTransaction(transaction.description), // AI categorization
          date: transaction.date,
          currency: transaction.currency,
          comment: transaction.comment || null,
        }))
      );

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
      
      toast({
        title: "Success",
        description: `Successfully imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} with AI categorization.`,
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
          Upload a CSV file to import your transactions. Transactions will be automatically categorized using AI for improved accuracy.
        </p>
      </div>
      
      <CsvUploadForm onTransactionsUploaded={handleTransactionsUploaded} />
    </div>
  );
}
