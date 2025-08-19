import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Brain } from 'lucide-react';
import { parseCsvFile } from './helpers/csvParser';
import { useTransactionInsertion, TransactionData } from './helpers/transactionInsertion';
import { AICategoryDiscovery } from '@/components/categories/AICategoryDiscovery';

interface UploadState {
  isUploading: boolean;
  progress: number;
  currentStep: string;
  transactions: TransactionData[];
  discoveredCategories: any[];
  results: {
    success: number;
    failed: number;
    categories_discovered: number;
    new_categories_created: number;
  } | null;
}

export default function CsvUploadForm() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    currentStep: 'idle',
    transactions: [],
    discoveredCategories: [],
    results: null
  });

  const { toast } = useToast();
  const transactionHelper = useTransactionInsertion();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadState(prev => ({ ...prev, currentStep: 'parsing' }));

    try {
      // Parse CSV file
      const transactions = await parseCsvFile(file);
      setUploadState(prev => ({ 
        ...prev, 
        transactions,
        currentStep: 'parsing_complete',
        progress: 25
      }));

      toast({
        title: 'CSV Parsed Successfully',
        description: `Found ${transactions.length} transactions`,
      });

    } catch (error) {
      console.error('CSV parsing error:', error);
      toast({
        title: 'CSV Parsing Failed',
        description: 'Please check your file format and try again.',
        variant: 'destructive',
      });
      setUploadState(prev => ({ ...prev, currentStep: 'idle' }));
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const handleProcessUpload = async () => {
    if (uploadState.transactions.length === 0) return;

    setUploadState(prev => ({ 
      ...prev, 
      isUploading: true, 
      currentStep: 'processing',
      progress: 50
    }));

    try {
      const results = await transactionHelper.processCsvUpload(uploadState.transactions);
      
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false,
        currentStep: 'complete',
        progress: 100,
        results
      }));

      toast({
        title: 'Upload Complete!',
        description: `Successfully processed ${results.success} transactions. Created ${results.new_categories_created} new categories.`,
      });

    } catch (error) {
      console.error('Upload processing error:', error);
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: false,
        currentStep: 'error'
      }));
      
      toast({
        title: 'Upload Failed',
        description: 'An error occurred while processing your upload.',
        variant: 'destructive',
      });
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      currentStep: 'idle',
      transactions: [],
      discoveredCategories: [],
      results: null
    });
  };

  const renderUploadArea = () => (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-900 mb-2">
        {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
      </p>
      <p className="text-sm text-gray-500">
        Or click to browse and select a file
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Supports .csv files with date, description, and amount columns
      </p>
    </div>
  );

  const renderParsingResults = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Parsing Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Transactions Found:</span>
            <span className="font-semibold">{uploadState.transactions.length}</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">Sample Transactions:</h4>
            {uploadState.transactions.slice(0, 5).map((txn, index) => (
              <div key={index} className="text-sm text-gray-600 py-1 border-b">
                <span className="font-medium">{txn.date}</span> - {txn.description} - ${txn.amount}
              </div>
            ))}
            {uploadState.transactions.length > 5 && (
              <div className="text-sm text-gray-500 italic">
                ... and {uploadState.transactions.length - 5} more
              </div>
            )}
          </div>

          <Button 
            onClick={handleProcessUpload}
            disabled={uploadState.isUploading}
            className="w-full"
          >
            {uploadState.isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Process with AI Category Discovery
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcessingProgress = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={uploadState.progress} className="w-full" />
          <p className="text-sm text-gray-600">
            {uploadState.currentStep === 'processing' && 'Discovering categories and processing transactions...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderResults = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Upload Complete
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadState.results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadState.results.success}</div>
                <div className="text-sm text-green-600">Successfully Processed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadState.results.categories_discovered}</div>
                <div className="text-sm text-blue-600">Categories Discovered</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadState.results.new_categories_created}</div>
                <div className="text-sm text-purple-600">New Categories Created</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadState.results.failed}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            <Button onClick={resetUpload} className="w-full">
              Upload Another File
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderError = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          Upload Failed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          An error occurred while processing your upload. Please try again.
        </p>
        <Button onClick={resetUpload} variant="outline" className="w-full">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Transaction Upload</h1>
        <p className="text-gray-600">
          Upload your bank statements and let AI automatically discover and categorize your transactions.
        </p>
      </div>

      {/* AI Category Discovery Component */}
      <AICategoryDiscovery />

      {/* Main Upload Area */}
      {uploadState.currentStep === 'idle' && renderUploadArea()}
      
      {/* Parsing Results */}
      {uploadState.currentStep === 'parsing_complete' && renderParsingResults()}
      
      {/* Processing Progress */}
      {uploadState.currentStep === 'processing' && renderProcessingProgress()}
      
      {/* Results */}
      {uploadState.currentStep === 'complete' && renderResults()}
      
      {/* Error */}
      {uploadState.currentStep === 'error' && renderError()}
    </div>
  );
}
