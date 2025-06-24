import { ChangeEvent, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePapaParse } from 'react-papaparse';
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/types/transaction-forms";
import { supabase } from "@/integrations/supabase/client";
import { categorizeTransactionsBatch } from "@/utils/aiCategorization";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

interface CSVRow {
  [key: string]: any;
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
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const { session } = useAuth();
  const { readString } = usePapaParse();
  const [uploading, setUploading] = useState(false);
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(true);

  useEffect(() => {
    if (csvHeaders.length > 0) {
      const autoMappings = autoDetectHeaders(csvHeaders);
      setHeaderMappings(autoMappings);
    }
  }, [csvHeaders]);

  const onDrop = (acceptedFiles: File[]) => {
    setCsvFile(acceptedFiles[0]);
    setIsMappingHeaders(true);
    parseCSV(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      if (!csvText) {
        toast({
          title: "Error",
          description: "Could not read file content",
          variant: "destructive",
        });
        return;
      }

      readString(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const headers = (results.meta.fields || []).filter(h => h);
            if (headers.length > 0) {
              setPreviewData(results.data.slice(0, 5) as CSVRow[]);
              setCsvHeaders(headers);
            } else {
              toast({
                title: "Error parsing CSV",
                description: "Could not detect headers in the CSV file.",
                variant: "destructive",
              });
              setIsMappingHeaders(false);
            }
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
    reader.readAsText(file);
  };

  const autoDetectHeaders = (headers: string[]): { [key: string]: string } => {
    const mappings: { [key: string]: string } = {
      date: '',
      description: '',
      amount: '',
      currency: '',
    };

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('date') || lowerHeader.includes('transaction') && lowerHeader.includes('date')) {
        mappings.date = header;
      } else if (lowerHeader.includes('description') || lowerHeader.includes('memo') || lowerHeader.includes('detail')) {
        mappings.description = header;
      } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('debit') || lowerHeader.includes('credit')) {
        mappings.amount = header;
      } else if (lowerHeader.includes('currency') || lowerHeader.includes('ccy')) {
        mappings.currency = header;
      }
    });

    return mappings;
  };

  const handleHeaderMappingChange = (header: string, field: string) => {
    setHeaderMappings(prev => ({ ...prev, [field]: header }));
  };

  const validateMappings = () => {
    const requiredFields = ['date', 'description', 'amount'];
    return requiredFields.every(field => headerMappings[field] !== '');
  };

  const handleUpload = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload transactions",
        variant: "destructive",
      });
      return;
    }

    if (!validateMappings()) {
      toast({
        title: "Mapping Error",
        description: "Please map all required headers (Date, Description, Amount)",
        variant: "destructive",
      });
      return;
    }

    if (!csvFile) {
      toast({
        title: "File Error",
        description: "No CSV file selected",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      if (!csvText) {
        toast({
          title: "Error",
          description: "Could not read file content",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      readString(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (!results.data || results.data.length === 0) {
            toast({
              title: "Parse Error",
              description: "No data found in the CSV file.",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

          const transactions = results.data.map((row: any) => ({
            date: row[headerMappings.date],
            description: row[headerMappings.description],
            amount: parseFloat(row[headerMappings.amount]),
            currency: row[headerMappings.currency] || 'AUD',
          })).filter(t => t.date && t.description && !isNaN(t.amount));

          if (transactions.length === 0) {
            toast({
              title: "Data Error",
              description: "No valid transactions found in the file.",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

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
    reader.readAsText(csvFile);
  };

  const handleTransactionsUploaded = async (transactions: any[]) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload transactions",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Processing ${transactions.length} uploaded transactions`);

      const descriptions = transactions.map(t => t.description);
      console.log("Starting batch categorization for uploaded transactions");
      
      const categories = await categorizeTransactionsBatch(descriptions, session.user.id);
      console.log("Batch categorization completed");

      const transactionsWithCategories = transactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index],
        user_id: session.user.id,
        account_id: null, 
      }));

      console.log(`Processing transactions with duplicate checking: ${transactionsWithCategories.length}`);

      let result;
      if (duplicateCheckEnabled) {
        const { insertTransactionsWithDuplicateCheck } = await import('@/components/transaction-forms/csv-upload/helpers/transactionInsertion');
        result = await insertTransactionsWithDuplicateCheck(transactionsWithCategories);
      } else {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionsWithCategories);

        if (insertError) {
          throw insertError;
        }

        result = { inserted: transactionsWithCategories.length, duplicates: 0 };
      }

      console.log(`Successfully processed transactions: ${result.inserted} new, ${result.duplicates} duplicates skipped`);

      if (result.inserted > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result.inserted} transactions${result.duplicates > 0 ? ` (${result.duplicates} skipped)` : ''}`,
        });
      } else if (result.duplicates > 0) {
        toast({
          title: "Info",
          description: `All ${result.duplicates} transactions were duplicates and skipped`,
        });
      } else {
        toast({
          title: "Error",
          description: "No transactions were uploaded",
          variant: "destructive",
        });
      }

      console.log("Calling onSuccess callback to close dialog");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error uploading transactions:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload transactions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className="border-2 border-dashed rounded-md p-6 cursor-pointer bg-muted hover:bg-accent transition-colors">
        <input {...getInputProps()} />
        <div className="text-center">
          <p className="text-muted-foreground">
            Drag 'n' drop a CSV file here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            CSV files with transaction data are supported
          </p>
        </div>
      </div>

      {isMappingHeaders && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Map CSV Headers</h3>
            <p className="text-sm text-muted-foreground">
              Please map the columns from your CSV to the corresponding fields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'date')} value={headerMappings.date}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'description')} value={headerMappings.description}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'amount')} value={headerMappings.amount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="duplicateCheck"
              checked={duplicateCheckEnabled}
              onChange={(e) => setDuplicateCheckEnabled(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="duplicateCheck">Enable intelligent duplicate detection</Label>
          </div>

          {duplicateCheckEnabled && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Duplicate detection is enabled. Transactions with the same description, amount, and date will be automatically skipped.
                Similar transactions (80%+ similarity) will also be detected and skipped.
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-md">
                  <thead>
                    <tr className="border-b bg-muted">
                      {csvHeaders.map((header) => (
                        <th key={header} className="text-left p-2 text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {csvHeaders.map((header) => (
                          <td key={header} className="p-2 text-sm">
                            {String(row[header])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsMappingHeaders(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !validateMappings()}
            >
              {uploading ? "Uploading..." : "Upload Transactions"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTransactions;
