import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Image, FileSpreadsheet, Loader2, Sparkles, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from "xlsx";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence: number;
  reasoning: string;
}

interface ProcessingResult {
  success: boolean;
  transactions: ExtractedTransaction[];
  summary: string;
  detectedFormat: string;
  warnings: string[];
  error?: string;
}

interface AIUniversalUploadProps {
  onComplete?: () => void;
}

type FileType = 'csv' | 'excel' | 'pdf' | 'image';

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Sample test data for quick testing
const SAMPLE_CSV_DATA = `Date,Description,Amount
2024-01-15,Woolworths Supermarket,-85.50
2024-01-16,Shell Petrol Station,-67.20
2024-01-17,Salary Payment,5000.00
2024-01-18,Netflix Subscription,-17.99
2024-01-19,Coffee Shop Purchase,-6.50
2024-01-20,Electric Bill Payment,-156.78
2024-01-21,Amazon Online Shopping,-89.99
2024-01-22,Uber Ride,-24.50
2024-01-23,Pharmacy Health Store,-32.45
2024-01-24,Restaurant Dinner,-78.00`;

export function AIUniversalUpload({ onComplete }: AIUniversalUploadProps) {
  const { session } = useAuth();
  const { accounts } = useAccounts();
  const { categoryData } = useCategories();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [editedTransactions, setEditedTransactions] = useState<ExtractedTransaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Flatten categories from the categoryData object
  const getAllCategories = useCallback(() => {
    if (!categoryData) return [];
    const categories: { name: string; type: string; id: string }[] = [];
    Object.values(categoryData).forEach(groups => {
      groups.forEach(group => {
        group.categories.forEach(cat => {
          categories.push({ name: cat.name, type: cat.type, id: cat.id });
        });
      });
    });
    return categories;
  }, [categoryData]);

  // Get category ID map
  const getCategoryIdMap = useCallback(() => {
    const map = new Map<string, string>();
    if (!categoryData) return map;
    Object.values(categoryData).forEach(groups => {
      groups.forEach(group => {
        group.categories.forEach(cat => {
          map.set(cat.name, cat.id);
        });
      });
    });
    return map;
  }, [categoryData]);

  const getFileType = (file: File): FileType => {
    const mimeType = file.type;
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (mimeType === 'text/csv' || extension === 'csv') return 'csv';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || extension === 'xlsx' || extension === 'xls') return 'excel';
    if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg'].includes(extension || '')) return 'image';
    
    return 'csv'; // Default fallback
  };

  const processFile = async (file: File): Promise<{ content: string; fileType: FileType; mimeType: string }> => {
    const fileType = getFileType(file);
    let content: string;
    let mimeType = file.type;

    switch (fileType) {
      case 'csv':
        content = await file.text();
        mimeType = 'text/csv';
        break;
      
      case 'excel':
        setProcessingStatus("Converting Excel to text...");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        content = XLSX.utils.sheet_to_csv(firstSheet);
        mimeType = 'text/csv';
        break;
      
      case 'pdf':
      case 'image':
        setProcessingStatus("Encoding file for AI processing...");
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        content = btoa(binary);
        break;
      
      default:
        content = await file.text();
    }

    return { content, fileType, mimeType };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 10MB");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatus("Reading file...");
    setResult(null);
    setUploadedFileName(file.name);

    try {
      // Process the file
      setProcessingProgress(20);
      const { content, fileType, mimeType } = await processFile(file);
      
      setProcessingProgress(30);
      setProcessingStatus("Sending to AI for extraction...");

      // Get user's categories
      const categories = getAllCategories().map(c => ({
        name: c.name,
        type: c.type
      }));

      // Call the edge function
      setProcessingProgress(50);
      setProcessingStatus("AI is extracting transactions...");

      const { data, error } = await supabase.functions.invoke('ai-process-file', {
        body: {
          fileContent: content,
          fileType,
          mimeType,
          userCategories: categories,
          accountCurrency: selectedAccount?.currency || 'USD'
        }
      });

      setProcessingProgress(90);

      if (error) {
        console.error('Edge function error:', error);
        toast.error("Failed to process file");
        setResult({
          success: false,
          transactions: [],
          summary: '',
          detectedFormat: '',
          warnings: [],
          error: error.message
        });
        return;
      }

      const processingResult = data as ProcessingResult;
      
      if (!processingResult.success) {
        toast.error(processingResult.error || "Failed to extract transactions");
        setResult(processingResult);
        return;
      }

      setProcessingProgress(100);
      setProcessingStatus("Complete!");
      setResult(processingResult);
      setEditedTransactions(processingResult.transactions);
      
      toast.success(`Extracted ${processingResult.transactions.length} transactions`);

    } catch (error) {
      console.error('File processing error:', error);
      toast.error("Failed to process file");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedAccountId, selectedAccount, getAllCategories]);

  const handleTestUpload = async () => {
    if (!selectedAccountId) {
      toast.error("Please select an account first");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatus("Loading sample data...");
    setResult(null);
    setUploadedFileName("sample-transactions.csv");

    try {
      setProcessingProgress(30);
      setProcessingStatus("Sending to AI for extraction...");

      const categories = getAllCategories().map(c => ({
        name: c.name,
        type: c.type
      }));

      setProcessingProgress(50);
      setProcessingStatus("AI is extracting transactions...");

      const { data, error } = await supabase.functions.invoke('ai-process-file', {
        body: {
          fileContent: SAMPLE_CSV_DATA,
          fileType: 'csv',
          mimeType: 'text/csv',
          userCategories: categories,
          accountCurrency: selectedAccount?.currency || 'USD'
        }
      });

      setProcessingProgress(90);

      if (error) {
        console.error('Edge function error:', error);
        toast.error("Failed to process test data");
        setResult({
          success: false,
          transactions: [],
          summary: '',
          detectedFormat: '',
          warnings: [],
          error: error.message
        });
        return;
      }

      const processingResult = data as ProcessingResult;
      
      if (!processingResult.success) {
        toast.error(processingResult.error || "Failed to extract transactions");
        setResult(processingResult);
        return;
      }

      setProcessingProgress(100);
      setProcessingStatus("Complete!");
      setResult(processingResult);
      setEditedTransactions(processingResult.transactions);
      
      toast.success(`Extracted ${processingResult.transactions.length} test transactions`);

    } catch (error) {
      console.error('Test upload error:', error);
      toast.error("Failed to process test data");
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    disabled: isProcessing || !selectedAccountId
  });

  const handleCategoryChange = (index: number, newCategory: string) => {
    setEditedTransactions(prev => 
      prev.map((tx, i) => 
        i === index ? { ...tx, category: newCategory, confidence: 1.0, reasoning: 'Manually assigned by user' } : tx
      )
    );
  };

  const handleSaveTransactions = async () => {
    if (!session?.user?.id || !selectedAccountId || editedTransactions.length === 0) {
      toast.error("Missing required data");
      return;
    }

    setIsSaving(true);

    try {
      const categoryIdMap = getCategoryIdMap();

      // Prepare transactions for insert
      // Note: asset_account_id and liability_account_id are for linking to assets/liabilities tables,
      // not the accounts table, so we leave them null for now
      const transactionsToInsert = editedTransactions.map(tx => {
        const categoryId = categoryIdMap.get(tx.category);
        const transactionType = tx.amount >= 0 ? 'income' : 'expense';
        
        return {
          user_id: session.user.id,
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          type: transactionType,
          category_id: categoryId || null,
          currency: selectedAccount?.currency || 'USD',
          categorization_source: 'ai',
          categorization_confidence: tx.confidence,
          ai_reasoning: tx.reasoning
        };
      });

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) {
        console.error('Insert error:', error);
        toast.error("Failed to save transactions");
        return;
      }

      toast.success(`Saved ${transactionsToInsert.length} transactions`);
      
      // Reset state
      setResult(null);
      setEditedTransactions([]);
      setUploadedFileName("");
      
      onComplete?.();

    } catch (error) {
      console.error('Save error:', error);
      toast.error("Failed to save transactions");
    } finally {
      setIsSaving(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-5 w-5" />;
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <Image className="h-5 w-5" />;
    if (['xlsx', 'xls'].includes(ext || '')) return <FileSpreadsheet className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge variant="default" className="bg-green-500">High</Badge>;
    if (confidence >= 0.7) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  const allCategories = getAllCategories();

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Transaction Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Account</label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${!selectedAccountId ? 'opacity-50 cursor-not-allowed' : ''}
              ${isProcessing ? 'pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{processingStatus}</p>
                <Progress value={processingProgress} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? "Drop the file here" : "Drop files here or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, Excel, PDF, and images (PNG, JPEG)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  AI will automatically extract and categorize transactions
                </p>
              </>
            )}
          </div>

          {/* Test Upload Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestUpload}
              disabled={isProcessing || !selectedAccountId}
              className="gap-2"
            >
              <FlaskConical className="h-4 w-4" />
              Test with Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {uploadedFileName && getFileIcon(uploadedFileName)}
                <span>{uploadedFileName || "Processing Result"}</span>
              </div>
              {result.detectedFormat && (
                <Badge variant="outline">{result.detectedFormat}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            {result.summary && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{result.summary}</p>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                <ul className="text-sm text-yellow-600 list-disc list-inside">
                  {result.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error */}
            {result.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{result.error}</p>
              </div>
            )}

            {/* Transactions Table */}
            {editedTransactions.length > 0 && (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editedTransactions.map((tx, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{tx.date}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={tx.description}>
                              {tx.description}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={tx.category} 
                                onValueChange={(value) => handleCategoryChange(index, value)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {getConfidenceBadge(tx.confidence)}
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={tx.reasoning}>
                                  {tx.reasoning}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setResult(null);
                      setEditedTransactions([]);
                      setUploadedFileName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveTransactions}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save {editedTransactions.length} Transactions
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
