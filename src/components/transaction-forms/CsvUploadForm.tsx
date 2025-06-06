
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { parseCSV } from "@/utils/csvParser";
import { categorizeTransaction } from "@/utils/transactionCategories";
import { supabase } from "@/integrations/supabase/client";
import { TransactionFormData, currencies } from "@/types/transaction-forms";
import { useAccounts } from "@/hooks/useAccounts";

interface CsvUploadFormProps {
  onTransactionParsed?: (transaction: TransactionFormData) => void;
}

export const CsvUploadForm = ({ onTransactionParsed }: CsvUploadFormProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [detectedCurrency, setDetectedCurrency] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const queryClient = useQueryClient();
  const accounts = useAccounts();

  console.log("CsvUploadForm component rendering");
  console.log("Available accounts:", accounts);
  console.log("Selected account:", selectedAccount);

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

    // Check if account is selected
    if (!selectedAccount) {
      toast({
        title: "Account Required",
        description: "Please select an account before uploading transactions.",
        variant: "destructive"
      });
      return;
    }

    console.log("Starting file upload with account:", selectedAccount);

    setIsUploading(true);
    setUploadProgress('Reading file...');

    try {
      const content = await file.text();
      console.log('CSV file content:', content.substring(0, 200) + '...');
      
      setUploadProgress('Parsing transactions...');
      const { transactions, errors, detectedCurrency: csvCurrency } = parseCSV(content);

      console.log(`Parsed ${transactions.length} transactions with ${errors.length} errors`);
      console.log('Detected currency:', csvCurrency);

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

      // Store pending transactions
      setPendingTransactions(transactions);

      // If currency wasn't detected, show currency selector
      if (!csvCurrency) {
        setShowCurrencySelector(true);
        setUploadProgress('Please select currency for your transactions');
        toast({
          title: "Currency Selection Required",
          description: "Could not detect currency from CSV. Please select the currency below.",
        });
        return;
      } else {
        setDetectedCurrency(csvCurrency);
        await processPendingTransactions(transactions, csvCurrency);
      }

    } catch (error) {
      console.error('Error processing CSV file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process the CSV file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      if (!showCurrencySelector) {
        setIsUploading(false);
        setUploadProgress('');
      }
    }
  };

  const processPendingTransactions = async (transactions: any[], currency: string) => {
    if (!session?.user?.id) return;

    try {
      setUploadProgress(`Uploading ${transactions.length} transactions...`);

      console.log("Processing transactions with account ID:", selectedAccount);

      const transactionsToInsert = transactions.map(transaction => ({
        user_id: session.user.id,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        category: transaction.category || categorizeTransaction(transaction.description),
        date: transaction.date,
        currency: currency,
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
        description: `Successfully imported ${transactions.length} transaction(s) to your account.`,
      });

      // Reset form
      setPendingTransactions([]);
      setShowCurrencySelector(false);
      setSelectedCurrency('');
      setSelectedAccount('');
      setDetectedCurrency('');
      
      if (transactions.length > 0 && onTransactionParsed) {
        const firstTransaction = transactions[0];
        const suggestedCategory = categorizeTransaction(firstTransaction.description);
        
        onTransactionParsed({
          description: firstTransaction.description,
          amount: firstTransaction.amount,
          category: suggestedCategory,
          date: firstTransaction.date,
          currency: currency,
          account_id: "",
        });
      }

    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to save transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleCurrencyConfirmation = async () => {
    if (!selectedCurrency) {
      toast({
        title: "Currency Required",
        description: "Please select a currency before proceeding.",
        variant: "destructive",
      });
      return;
    }

    await processPendingTransactions(pendingTransactions, selectedCurrency);
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

      {showCurrencySelector && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency-select">Select Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Choose currency for your transactions" />
              </SelectTrigger>
              <SelectContent 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[70]"
                position="popper"
                sideOffset={4}
              >
                {currencies.map((currency) => (
                  <SelectItem 
                    key={currency.code} 
                    value={currency.code}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {currency.symbol} {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCurrencyConfirmation}
            className="w-full"
            disabled={!selectedCurrency}
          >
            Upload {pendingTransactions.length} Transactions
          </Button>
        </div>
      )}

      {!showCurrencySelector && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-select">Select Account *</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choose account (required)" />
              </SelectTrigger>
              <SelectContent 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-[70]"
                position="popper"
                sideOffset={4}
              >
                {accounts.map((account) => (
                  <SelectItem 
                    key={account.id} 
                    value={account.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {account.name} ({account.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="flex-1"
              disabled={isUploading || !selectedAccount}
            />
            {isUploading && (
              <div className="text-sm text-muted-foreground">
                {uploadProgress}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
