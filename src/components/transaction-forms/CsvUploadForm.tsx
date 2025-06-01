
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { parseCSV } from "@/utils/csvParser";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { supabase } from "@/integrations/supabase/client";
import { TransactionFormData } from "@/types/transaction-forms";

interface CsvUploadFormProps {
  onTransactionParsed?: (transaction: TransactionFormData) => void;
}

export const CsvUploadForm = ({ onTransactionParsed }: CsvUploadFormProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to upload transactions.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress('Reading file...');

    try {
      const content = await file.text();
      console.log('CSV file content:', content.substring(0, 200) + '...');
      
      setUploadProgress('Parsing transactions...');
      const { transactions, errors } = parseCSV(content);

      console.log(`Parsed ${transactions.length} transactions with ${errors.length} errors`);

      if (errors.length > 0) {
        console.warn('CSV parsing errors:', errors);
        
        const errorMessage = errors.slice(0, 3).map(e => 
          `Row ${e.row}: ${e.message}`
        ).join('\n');
        
        toast({
          title: `Found ${errors.length} parsing error(s)`,
          description: errorMessage + (errors.length > 3 ? '\n...and more' : ''),
          variant: "destructive",
        });
      }

      if (transactions.length === 0) {
        toast({
          title: "No valid transactions",
          description: "No valid transactions found in the CSV file. Please check the format and try again.",
          variant: "destructive",
        });
        return;
      }

      setUploadProgress(`Uploading ${transactions.length} transactions...`);

      const transactionsToInsert = transactions.map(transaction => ({
        user_id: session.user.id,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        category: transaction.category || categorizeTransaction(transaction.description),
        date: transaction.date,
        currency: transaction.currency || "USD"
      }));

      console.log('Inserting transactions:', transactionsToInsert);

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Error bulk inserting transactions:', error);
        throw error;
      }

      console.log('Bulk insert successful');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast({
        title: "CSV Upload Successful",
        description: `Successfully imported ${transactions.length} transaction(s) to your account.${errors.length > 0 ? ` ${errors.length} rows had errors and were skipped.` : ''}`,
      });

      event.target.value = '';
      
      if (transactions.length > 0 && onTransactionParsed) {
        const firstTransaction = transactions[0];
        const suggestedCategory = categorizeTransaction(firstTransaction.description);
        
        onTransactionParsed({
          description: firstTransaction.description,
          amount: firstTransaction.amount,
          category: suggestedCategory,
          date: firstTransaction.date,
          currency: firstTransaction.currency || "USD",
        });
      }

    } catch (error) {
      console.error('Error processing CSV file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Upload className="h-4 w-4" />
        <AlertTitle>CSV Import</AlertTitle>
        <AlertDescription>
          Upload a CSV file. Supports two formats:
          <br />
          <strong>Format 1:</strong> Date,Description,Amount,Currency
          <br />
          <strong>Format 2:</strong> Date,Amount,Description,Balance (Australian bank format)
          <br />
          Example: "28/03/2025,-14000.00,CITIBANK CREDITCARDS,+8002.48"
        </AlertDescription>
      </Alert>

      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="flex-1"
          disabled={isUploading}
        />
        {isUploading && (
          <div className="text-sm text-muted-foreground">
            {uploadProgress}
          </div>
        )}
      </div>
    </div>
  );
};
