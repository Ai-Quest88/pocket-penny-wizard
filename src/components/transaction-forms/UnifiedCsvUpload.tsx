import { useState } from "react";
import { FileUploadSection } from "./csv-upload/FileUploadSection";
import { ColumnMappingSection } from "./csv-upload/ColumnMappingSection";
import { DefaultSettingsSection } from "./csv-upload/DefaultSettingsSection";
import { PreviewTable } from "./csv-upload/PreviewTable";
import { AutoMappingAlert } from "./csv-upload/AutoMappingAlert";
import { AccountSelectionSection } from "./csv-upload/AccountSelectionSection";
import { DuplicateReviewDialog } from "./csv-upload/DuplicateReviewDialog";
import { ProgressiveUpload } from "./ProgressiveUpload";
import { insertTransactionsWithDuplicateCheck } from "./csv-upload/helpers/transactionInsertion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

interface CSVRow {
  [key: string]: string | number | boolean;
}

interface DefaultSettings {
  description: string;
  currency: string;
  category: string;
}

interface UploadProgress {
  phase: 'uploading' | 'categorizing' | 'saving' | 'updating-balances' | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
  processedTransactions: any[];
}

interface UnifiedCsvUploadProps {
  onComplete?: () => void;
}

const initialMappings: Record<string, string> = {
  description: '',
  amount: '',
  date: '',
  currency: '',
};

const initialSettings: DefaultSettings = {
  description: '',
  currency: 'AUD',
  category: 'Other',
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const formatDateForSupabase = (dateString: string): string => {
  try {
    console.log(`🗓️ Formatting date for Supabase: "${dateString}" (type: ${typeof dateString})`);
    
    // If dateString is already in YYYY-MM-DD format, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.log(`🗓️ Already in ISO format: ${dateString}`);
      return dateString;
    }
    
    // Handle DD/MM/YYYY format specifically
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(ddmmyyyyPattern);
    
    if (match) {
      const [, day, month, year] = match;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      console.log(`🗓️ Parsed DD/MM/YYYY: day=${dayNum}, month=${monthNum}, year=${yearNum}`);
      
      // Validate date components
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        // Create date in YYYY-MM-DD format for proper parsing
        const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log(`🗓️ Converted DD/MM/YYYY ${dateString} -> ${isoDateString}`);
        return isoDateString;
      } else {
        console.warn(`🗓️ Invalid date components: day=${dayNum}, month=${monthNum}, year=${yearNum}`);
      }
    }
    
    // Try parsing as Date object for other formats
    const parsedDate = new Date(dateString);
    if (!isNaN(parsedDate.getTime())) {
      const result = parsedDate.toISOString().split('T')[0];
      console.log(`🗓️ Parsed as Date object ${dateString} -> ${result}`);
      return result;
    }
    
    // Final fallback - use today's date
    console.warn(`🗓️ Could not parse date: "${dateString}". Using current date.`);
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error("🗓️ Error formatting date:", error);
    return new Date().toISOString().split('T')[0];
  }
};

export const UnifiedCsvUpload = ({ onComplete }: UnifiedCsvUploadProps) => {
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>(initialMappings);
  const [defaultSettings, setDefaultSettings] = useState<DefaultSettings>(initialSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMappedColumns, setAutoMappedColumns] = useState<{ [key: string]: string }>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { accounts } = useAccounts();
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const handleFileUpload = (data: CSVRow[], fileHeaders: string[]) => {
    console.log('handleFileUpload called with:', { data: data.slice(0, 2), fileHeaders });
    setParsedData(data);
    setHeaders(fileHeaders);
    setAutoMapColumns(data, fileHeaders);
  };

  const setAutoMapColumns = async (data: CSVRow[], fileHeaders: string[]) => {
    console.log('setAutoMapColumns called with:', { dataLength: data.length, fileHeaders });
    if (!data.length) return;

    // Use the enhanced auto-mapping from csvParser.ts
    const { autoMapColumns } = await import('@/utils/csvParser');
    
    // Convert data to string arrays for analysis
    const stringData = data.map(row => 
      fileHeaders.map(header => String(row[header] || ''))
    );
    
    const autoMappings = autoMapColumns(fileHeaders, stringData);
    console.log('Enhanced auto-mapping result:', autoMappings);
    
    setAutoMappedColumns(autoMappings);
    
    // Automatically apply the detected mappings
    const newMappings = {
      ...mappings,
      description: autoMappings.description || mappings.description,
      amount: autoMappings.amount || mappings.amount,
      date: autoMappings.date || mappings.date,
      currency: autoMappings.currency || mappings.currency,
    };
    console.log('Setting new mappings:', newMappings);
    setMappings(newMappings);
  };

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({ ...prev, [field]: header }));
  };

  const handleDefaultSettingsChange = (field: keyof DefaultSettings, value: string) => {
    setDefaultSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAcceptAutoMapping = () => {
    setMappings(prev => ({
      ...prev,
      description: autoMappedColumns.description || prev.description,
      amount: autoMappedColumns.amount || prev.amount,
      date: autoMappedColumns.date || prev.date,
      currency: autoMappedColumns.currency || prev.currency,
    }));
  };

  const isValidConfiguration = (): boolean => {
    if (!mappings.description || !mappings.amount || !mappings.date) {
      return false;
    }
    if (!selectedAccountId) {
      return false;
    }
    return true;
  };

  const handleDuplicateReview = (approvedIndices: number[]) => {
    setShowDuplicateReview(false);
    // Continue with the upload using approved transactions
    continueUpload(approvedIndices);
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateReview(false);
    setIsProcessing(false);
    setPendingTransactions([]);
    setDuplicateGroups([]);
    setUploadProgress(null);
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setUploadProgress(null);
    setPendingTransactions([]);
    setDuplicateGroups([]);
  };

  const continueUpload = async (userApprovedDuplicates?: number[]) => {
    try {
      console.log('🔄 Continuing upload with user decisions...', userApprovedDuplicates);
      
      setUploadProgress({
        phase: 'saving',
        currentStep: 1,
        totalSteps: 1,
        message: 'Saving transactions to database...',
        processedTransactions: pendingTransactions
      });

      const result = await insertTransactionsWithDuplicateCheck(pendingTransactions, userApprovedDuplicates);
      
      // Count categorization results
      const categories = pendingTransactions.map(t => t.category);
      const categoryCounts = categories.reduce((acc, category) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const miscellaneousCount = categoryCounts['Uncategorized'] || 0;
      const successfullyCategorizeed = categories.length - miscellaneousCount;
      
      console.log('📊 Categorization Summary:');
      console.log(`  Successfully categorized: ${successfullyCategorizeed}/${categories.length}`);
      console.log(`  Uncategorized: ${miscellaneousCount}/${categories.length}`);
      console.log('  Category breakdown:', categoryCounts);
      
      const uploadMessage = `${result.inserted} transactions inserted, ${result.duplicates} duplicates skipped`;
      const categorizationMessage = miscellaneousCount > 0 
        ? ` • ${successfullyCategorizeed}/${categories.length} auto-categorized, ${miscellaneousCount} marked as Uncategorized`
        : ` • All ${categories.length} transactions auto-categorized!`;
      
      toast({
        title: "Upload completed",
        description: uploadMessage + categorizationMessage,
      });

      console.log('Upload completed:', result.inserted, 'inserted,', result.duplicates, 'duplicates skipped');
      
      setUploadProgress({
        phase: 'updating-balances',
        currentStep: 1,
        totalSteps: 1,
        message: 'Updating account balances...',
        processedTransactions: pendingTransactions
      });
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      setUploadProgress({
        phase: 'complete',
        currentStep: 1,
        totalSteps: 1,
        message: 'Upload completed successfully!',
        processedTransactions: pendingTransactions
      });

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
        onComplete?.();
      }, 3000);
    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Error",
        description: "Failed to process transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (uploadProgress?.phase !== 'complete') {
        setIsProcessing(false);
        setUploadProgress(null);
        setPendingTransactions([]);
        setDuplicateGroups([]);
      }
    }
  };

  const processTransactions = async () => {
    if (!session?.user || !parsedData.length) return;
    
    // Validate account selection
    if (!selectedAccountId) {
      toast({
        title: "Account Required",
        description: "Please select an account before uploading transactions.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setUploadProgress({
        phase: 'uploading',
        currentStep: 1,
        totalSteps: 1,
        message: 'Preparing transactions for upload...',
        processedTransactions: []
      });
      console.log(`🚀 Processing ${parsedData.length} transactions from CSV`);

      // First, prepare the basic transaction data
      console.log('🔧 Account selection debug:');
      console.log('  selectedAccountId:', selectedAccountId);
      console.log('  available accounts:', accounts.length);
      
      const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null;
      console.log('  selectedAccount:', selectedAccount);
      
      const basicTransactions = parsedData.map((row) => {
        const transaction = {
          user_id: session.user.id,
          description: String(row[mappings.description] || defaultSettings.description || 'Unknown transaction'),
          amount: Number(row[mappings.amount] || 0),
          date: formatDateForSupabase(String(row[mappings.date] || new Date().toISOString().split('T')[0])),
          currency: String(row[mappings.currency] || defaultSettings.currency || 'AUD'),
          asset_account_id: selectedAccount?.accountType === 'asset' ? selectedAccountId : null,
          liability_account_id: selectedAccount?.accountType === 'liability' ? selectedAccountId : null,
        };
        
        return transaction;
      });
      
      console.log('  Sample transaction with account linking:', basicTransactions[0]);

      console.log('📋 Basic transactions prepared:', basicTransactions.length);
      console.log('📝 Sample basic transaction:', basicTransactions[0]);
      
      // Check for any invalid transactions
      const invalidTransactions = basicTransactions.filter(t => 
        !t.description || t.amount === 0 || !t.date || !t.user_id
      );
      if (invalidTransactions.length > 0) {
        console.warn(`⚠️ Found ${invalidTransactions.length} invalid transactions:`, invalidTransactions);
      }

      // Use AI categorization for all transactions
      const descriptions = basicTransactions.map(t => t.description);
      const amounts = basicTransactions.map(t => t.amount);
      console.log('Starting AI categorization for', descriptions.length, 'transactions');
      console.log('Sample descriptions:', descriptions.slice(0, 3));
      
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: descriptions.length,
        message: 'AI is categorizing your transactions...',
        processedTransactions: []
      });
      
      // Import the categorization function
      const { categorizeTransactionsBatch } = await import('@/utils/aiCategorization');
      const categories = await categorizeTransactionsBatch(descriptions, session.user.id, amounts);
      console.log('AI categorization completed, got', categories.length, 'categories');
      console.log('Sample categories:', categories.slice(0, 3));

      // Add categories to transactions
      const transactionsWithCategories = basicTransactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index] || defaultSettings.category || 'Other',
      }));

      console.log('Transactions with categories:', transactionsWithCategories.slice(0, 2));
      
      setUploadProgress({
        phase: 'categorizing',
        currentStep: descriptions.length,
        totalSteps: descriptions.length,
        message: 'Categorization complete!',
        processedTransactions: transactionsWithCategories
      });

      // Store transactions for potential duplicate review
      setPendingTransactions(transactionsWithCategories);

      // First check for duplicates
      const result = await insertTransactionsWithDuplicateCheck(transactionsWithCategories);
      
      // If duplicates need user review, show the dialog
      if (result.needsUserReview && result.potentialDuplicates) {
        console.log('🔍 Showing duplicate review dialog');
        setDuplicateGroups(result.potentialDuplicates);
        setShowDuplicateReview(true);
        return; // Don't finish processing yet
      }

      // If no duplicates or user already reviewed, continue normally
      await continueUpload();
      
    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Error",
        description: "Failed to process transactions. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  // Show progressive upload UI when processing
  if (uploadProgress) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <ProgressiveUpload 
            progress={uploadProgress}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <FileUploadSection 
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
      />
      
      {parsedData.length > 0 && (
        <>
          <AutoMappingAlert 
            autoMappedColumns={autoMappedColumns}
            onAcceptMapping={handleAcceptAutoMapping}
          />
          
          <ColumnMappingSection
            headers={headers}
            mappings={mappings}
            onMappingChange={handleMappingChange}
          />
          
          <DefaultSettingsSection
            defaultSettings={defaultSettings}
            onSettingsChange={handleDefaultSettingsChange}
          />

          <AccountSelectionSection
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
          />
          
          {/* Add detailed debugging */}
          <div className="px-4 py-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800">Column Mapping Status</h4>
            <div className="mt-1 text-xs text-yellow-700 space-y-1">
              <p>Description column: {mappings.description || "Not mapped"}</p>
              <p>Amount column: {mappings.amount || "Not mapped"}</p>
              <p>Date column: {mappings.date || "Not mapped"}</p>
              <p>Currency column: {mappings.currency || "Not mapped"}</p>
            </div>
          </div>
          
          <PreviewTable
            data={parsedData}
            mappings={{
              description: mappings.description,
              amount: mappings.amount,
              date: mappings.date,
              currency: mappings.currency,
            }}
            defaultSettings={defaultSettings}
            selectedAccount={selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null}
          />
          
          <div className="flex flex-col items-end space-y-2">
            {!selectedAccountId && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Please select an account to continue
              </p>
            )}
            <Button 
              onClick={processTransactions}
              disabled={isProcessing || !isValidConfiguration()}
              size="lg"
            >
              {isProcessing ? 'Processing...' : `Upload ${parsedData.length} Transactions`}
            </Button>
          </div>
        </>
      )}

      <DuplicateReviewDialog
        isOpen={showDuplicateReview}
        duplicateGroups={duplicateGroups}
        onResolve={handleDuplicateReview}
        onCancel={handleDuplicateCancel}
      />
    </div>
  );
};
