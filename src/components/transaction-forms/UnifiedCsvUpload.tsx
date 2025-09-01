import { useState } from "react";
import { FileUploadSection } from "./csv-upload/FileUploadSection";
import { ColumnMappingSection } from "./csv-upload/ColumnMappingSection";

import { PreviewTable } from "./csv-upload/PreviewTable";

import { AutoMappingAlert } from "./csv-upload/AutoMappingAlert";
import { AccountSelectionSection } from "./csv-upload/AccountSelectionSection";
import { DuplicateReviewDialog } from "./csv-upload/DuplicateReviewDialog";
import { CategoryReviewDialog } from "./csv-upload/CategoryReviewDialog";
import { ProgressiveUpload } from "./ProgressiveUpload";
import { useTransactionInsertion } from "./csv-upload/helpers/transactionInsertion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";
import { addUserCategoryRule } from "@/utils/transactionCategories";


import { supabase } from "@/integrations/supabase/client";

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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMappedColumns, setAutoMappedColumns] = useState<{ [key: string]: string }>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [showCategoryReview, setShowCategoryReview] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const { accounts } = useAccounts();
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const transactionHelper = useTransactionInsertion();

  // Debug account selection
  console.log('UnifiedCsvUpload - Accounts:', accounts);
  console.log('UnifiedCsvUpload - Selected Account ID:', selectedAccountId);
  console.log('UnifiedCsvUpload - Found Account:', selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null);

  const handleFileUpload = (data: CSVRow[], fileHeaders: string[]) => {
    console.log('handleFileUpload called with:', { data: data.slice(0, 2), fileHeaders });
    setParsedData(data);
    setHeaders(fileHeaders);
    setAutoMapColumns(data, fileHeaders);
  };

  const handleDataChange = (updatedData: CSVRow[]) => {
    console.log('Data updated in preview:', updatedData.slice(0, 2));
    setParsedData(updatedData);
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
    };
    console.log('Setting new mappings:', newMappings);
    setMappings(newMappings);
  };

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({ ...prev, [field]: header }));
  };


  const handleAcceptAutoMapping = () => {
    setMappings(prev => ({
      ...prev,
      description: autoMappedColumns.description || prev.description,
      amount: autoMappedColumns.amount || prev.amount,
      date: autoMappedColumns.date || prev.date,
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

  const handleCategoryReview = async (
    reviewedTransactions: any[], 
    shouldCreateRules: boolean = false
  ) => {
    console.log('Category review completed, saving to database...', { count: reviewedTransactions.length, shouldCreateRules });
    
    setShowCategoryReview(false);
    setIsProcessing(true);
    
    setUploadProgress({
      phase: 'saving',
      currentStep: 2,
      totalSteps: 2,
      message: 'Saving transactions to database...',
      processedTransactions: reviewedTransactions
    });

    try {
      // Save transactions directly to database
      const transactionsToInsert = reviewedTransactions.map(transaction => ({
        user_id: transaction.user_id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        currency: transaction.currency,
        category_name: transaction.userCategory || transaction.category,
        asset_account_id: transaction.asset_account_id,
        liability_account_id: transaction.liability_account_id,
        comment: transaction.comment || null,
      }));

      console.log('Inserting transactions:', transactionsToInsert.slice(0, 2));

      const { data: insertedTransactions, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Transactions inserted successfully:', insertedTransactions?.length);

      // Smart rules functionality has been moved to the new category management system
      // Rules are now handled automatically through AI categorization

      setUploadProgress({
        phase: 'complete',
        currentStep: 2,
        totalSteps: 2,
        message: `Successfully uploaded ${transactionsToInsert.length} transactions!`,
        processedTransactions: insertedTransactions || []
      });

      // Show success and cleanup
      toast({
        title: "Success! 🎉",
        description: `${transactionsToInsert.length} transactions uploaded successfully${shouldCreateRules ? ' with smart rules created' : ''}.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // Complete the upload process
      setTimeout(() => {
        setUploadProgress(null);
        setIsProcessing(false);
        
        // Clear all data
        setParsedData([]);
        setHeaders([]);
        setMappings(initialMappings);
        setSelectedAccountId(null);
        setPendingTransactions([]);
        
        if (onComplete) {
          onComplete();
        }
      }, 2000);

    } catch (error) {
      console.error('Error saving transactions:', error);
      toast({
        title: "Database Error",
        description: `Failed to save transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setUploadProgress(null);
      setIsProcessing(false);
    }
  };

  const handleDuplicateCancel = () => {
    setShowDuplicateReview(false);
    setShowCategoryReview(false);
    setIsProcessing(false);
    setPendingTransactions([]);
    setDuplicateGroups([]);
    setUploadProgress(null);
  };

  const handleCancel = () => {
    setIsProcessing(false);
    setShowCategoryReview(false);
    setUploadProgress(null);
    setPendingTransactions([]);
    setDuplicateGroups([]);
  };



  const continueUpload = async (userApprovedDuplicates?: number[], transactionsToProcess?: any[]) => {
    try {
      console.log('🔄 Starting hierarchical AI categorization and upload...', userApprovedDuplicates);
      
      // Use passed transactions or fall back to pendingTransactions
      const transactionsForProcessing = transactionsToProcess || pendingTransactions;
      console.log('📦 Transactions to process:', transactionsForProcessing.length);
      
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 1,
        totalSteps: 3,
        message: 'Discovering categories with AI...',
        processedTransactions: transactionsForProcessing
      });

      // Use hierarchical AI categorization system
      const result = await transactionHelper.processCsvUpload(transactionsForProcessing);
      
      // Count categorization results
      const categories = transactionsForProcessing.map(t => t.category);
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
      
      const uploadMessage = `${result.success} transactions processed, ${result.failed} failed`;
      const categorizationMessage = result.new_categories_created > 0 
        ? ` • ${result.new_categories_created} new categories created, ${result.categories_discovered} total categories discovered`
        : ` • Used existing categories for all transactions`;
      
      toast({
        title: "Upload completed",
        description: uploadMessage + categorizationMessage,
      });

      console.log('Upload completed:', result.success, 'successful,', result.failed, 'failed');
      
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
      // Invalidate categories to show AI-discovered hierarchy
      queryClient.invalidateQueries({ queryKey: ['categories-with-relations'] });
      
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
    console.log('🚀 processTransactions called!');
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload transactions.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress({
      phase: 'categorizing',
      currentStep: 1,
      totalSteps: 3,
      message: 'AI is categorizing your transactions...',
      processedTransactions: []
    });

    try {
      const formattedTransactions = parsedData.map((row) => {
        const description = getValue(row, mappings.description, 'Transaction');
        const amountStr = String(getValue(row, mappings.amount, '0'));
        const amount = parseFloat(amountStr.replace(/[^-\d.]/g, ''));
        const dateStr = getValue(row, mappings.date, '');
        const currency = 'AUD'; // Fixed currency

        // Get the selected account details
        const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null;

        return {
          user_id: session.user.id,
          description: description.trim(),
          amount: amount,
          date: formatDateForSupabase(dateStr),
          currency: currency,
          category: 'Uncategorized', // Will be set by AI
          asset_account_id: selectedAccount?.accountType === 'asset' ? selectedAccountId : null,
          liability_account_id: selectedAccount?.accountType === 'liability' ? selectedAccountId : null,
        };
      });

      console.log('Formatted transactions for AI categorization:', formattedTransactions.slice(0, 2));

      // Call AI categorization first
      console.log('🎯 Calling AI categorization for', formattedTransactions.length, 'transactions');
      
      const { data, error } = await supabase.functions.invoke('discover-categories', {
        body: { 
          transactions: formattedTransactions.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date
          }))
        }
      });

      if (error) {
        console.error('AI categorization failed:', error);
        toast({
          title: "AI Categorization Failed",
          description: "Using fallback categorization. You can still review and edit categories.",
          variant: "destructive",
        });
      }

      // Merge AI categorization results with formatted transactions
      const categorizedTransactions = formattedTransactions.map((transaction, index) => {
        if (data?.success && data?.categorized_transactions?.[index]) {
          const aiResult = data.categorized_transactions[index];
          return {
            ...transaction,
            category: aiResult.category_name || 'Uncategorized',
            category_id: aiResult.category_id || null,
            aiConfidence: aiResult.confidence || 0.5
          };
        }
        return {
          ...transaction,
          category: 'Uncategorized',
          category_id: null,
          aiConfidence: 0.3
        };
      });

      console.log('AI categorized transactions preview:', categorizedTransactions.slice(0, 2));

      // Store categorized transactions and show category review dialog
      setPendingTransactions(categorizedTransactions);
      setUploadProgress(null);
      setIsProcessing(false);
      setShowCategoryReview(true);

    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process transactions. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
      setUploadProgress(null);
    }
  };

  // Helper function to get values from CSV data
  const getValue = (row: any, field: string, defaultValue: string = '') => {
    if (!field) return defaultValue;
    const value = row[field];
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return value;
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
      <h3 className="text-lg font-medium">Upload Transaction Data</h3>
      
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
            </div>
          </div>
          
          <PreviewTable
            data={parsedData}
            mappings={{
              description: mappings.description,
              amount: mappings.amount,
              date: mappings.date,
              currency: 'AUD',
            }}
            defaultSettings={initialSettings}
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
              {isProcessing ? 'Processing...' : `Review & Upload ${parsedData.length} Transactions`}
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

      <CategoryReviewDialog
        open={showCategoryReview}
        onOpenChange={setShowCategoryReview}
        transactions={pendingTransactions}
        onConfirm={handleCategoryReview}
        isApplying={false}
      />
    </div>
  );
};
