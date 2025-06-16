import { ChangeEvent, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { usePapaParse } from 'react-papaparse';
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/types/transaction-forms";
import { supabase } from "@/integrations/supabase/client";
import { categorizeTransactionsBatch } from "@/utils/aiCategorization";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

interface CSVRow {
  date: string;
  description: string;
  amount: string;
  currency: string;
}

const ImportTransactions = ({ onSuccess }: ImportTransactionsProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [headerMappings, setHeaderMappings] = useState<{ [key: string]: string }>({
    date: '',
    description: '',
    amount: '',
    currency: '',
  });
  const [isMappingHeaders, setIsMappingHeaders] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const { session } = useAuth();
  const { readString } = usePapaParse();
  const [uploading, setUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    setCsvFile(acceptedFiles[0]);
    setIsMappingHeaders(true);
    parseCSV(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'text/csv': ['.csv'] } });

  const parseCSV = (file: File) => {
    readString(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Limit preview data to first 5 rows
          setPreviewData(results.data.slice(0, 5) as CSVRow[]);
        } else {
          toast({
            title: "Error parsing CSV",
            description: "No data found in the CSV file.",
            variant: "destructive",
          });
          setIsMappingHeaders(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsMappingHeaders(false);
      },
    });
  };

  const handleHeaderMappingChange = (header: string, field: string) => {
    setHeaderMappings(prev => ({ ...prev, [field]: header }));
  };

  const validateMappings = () => {
    const requiredFields = ['date', 'description', 'amount', 'currency'];
    return requiredFields.every(field => headerMappings[field] !== '');
  };

  const handleUpload = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to upload transactions");
      return;
    }

    if (!validateMappings()) {
      toast.error("Please map all required headers");
      return;
    }

    if (!csvFile) {
      toast.error("No CSV file selected");
      return;
    }

    setUploading(true);

    readString(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          toast.error("No data found in the CSV file.");
          setUploading(false);
          return;
        }

        const transactions = results.data.map((row: any) => ({
          date: row[headerMappings.date],
          description: row[headerMappings.description],
          amount: parseFloat(row[headerMappings.amount]),
          currency: row[headerMappings.currency],
        }));

        await handleTransactionsUploaded(transactions);
        setUploading(false);
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setUploading(false);
      },
    });
  };

  const handleTransactionsUploaded = async (transactions: any[]) => {
    if (!session?.user?.id) {
      toast.error("Please log in to upload transactions");
      return;
    }

    try {
      console.log(`Processing ${transactions.length} uploaded transactions`);

      // Get account balances for account mapping
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, name, type')
        .eq('user_id', session.user.id);

      // Categorize transactions in batch
      const descriptions = transactions.map(t => t.description);
      console.log("Starting batch categorization for uploaded transactions");
      
      const categories = await categorizeTransactionsBatch(descriptions, session.user.id);
      console.log("Batch categorization completed");

      // Prepare transactions with categories and account IDs
      const transactionsWithCategories = transactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index],
        user_id: session.user.id,
        account_id: accounts?.[0]?.id || null,
      }));

      console.log(`Inserting transactions to database with AI categories and account IDs: ${transactionsWithCategories.length}`);

      // Use the new duplicate checking insertion method
      const { insertTransactionsWithDuplicateCheck } = await import('@/components/transaction-forms/csv-upload/helpers/transactionInsertion');
      const result = await insertTransactionsWithDuplicateCheck(transactionsWithCategories);

      console.log(`Successfully processed transactions: ${result.inserted} new, ${result.duplicates} duplicates skipped`);

      if (result.inserted > 0) {
        toast.success(`Successfully uploaded ${result.inserted} transactions${result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}`);
      } else if (result.duplicates > 0) {
        toast.info(`All ${result.duplicates} transactions were duplicates and skipped`);
      } else {
        toast.error("No transactions were uploaded");
      }

      console.log("Calling onSuccess callback to close dialog");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error uploading transactions:", error);
      toast.error("Failed to upload transactions");
    }
  };

  return (
    <div>
      <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 cursor-pointer bg-muted hover:bg-accent">
        <input {...getInputProps()} />
        <p className="text-center text-muted-foreground">
          Drag 'n' drop some files here, or click to select files
        </p>
      </div>

      {isMappingHeaders && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Map CSV Headers</h2>
          <p className="text-sm text-muted-foreground">
            Please map the columns from your CSV to the corresponding fields.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'date')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'description')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'amount')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'currency')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {previewData.length > 0 && Object.keys(previewData[0]).map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleUpload} disabled={uploading} className="mt-4">
            {uploading ? "Uploading..." : "Upload Transactions"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImportTransactions;
