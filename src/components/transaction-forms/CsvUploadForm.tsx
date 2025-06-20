import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload } from "lucide-react"
import { parseCsvFile } from "@/utils/csvParser"
import { FileUploadSection } from "./csv-upload/FileUploadSection"
import { AutoMappingAlert } from "./csv-upload/AutoMappingAlert"
import { ColumnMappingSection } from "./csv-upload/ColumnMappingSection"
import { PreviewTable } from "./csv-upload/PreviewTable"
import { DefaultSettingsSection } from "./csv-upload/DefaultSettingsSection"
import { ProgressiveUpload } from "./ProgressiveUpload"
import { categorizeTransactionsBatch } from "@/utils/aiCategorization"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { CsvUploadProps, Transaction } from "@/types/transaction-forms"

interface UploadProgress {
  phase: 'uploading' | 'categorizing' | 'saving' | 'updating-balances' | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
  processedTransactions: any[];
}

export const CsvUploadForm: React.FC<CsvUploadProps> = ({ onTransactionsUploaded }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [autoMapped, setAutoMapped] = useState<Record<string, string>>({})
  const [defaultCurrency, setDefaultCurrency] = useState('AUD')
  const [defaultAccount, setDefaultAccount] = useState('Default Account')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [showAccountError, setShowAccountError] = useState(false)
  
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const requiredFields = ['date', 'amount', 'description']

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)
    setError(null)
    setUploadProgress({
      phase: 'uploading',
      currentStep: 1,
      totalSteps: 1,
      message: 'Reading and parsing file...',
      processedTransactions: []
    })

    try {
      const result = await parseCsvFile(selectedFile)
      
      if (!result.success) {
        setError(result.error || 'Unknown error occurred')
        setHeaders([])
        setPreview([])
        setTotalRows(0)
        setColumnMappings({})
        setAutoMapped({})
        setUploadProgress(null)
        return
      }

      if (!result.headers || result.headers.length === 0) {
        setError('No headers found in the file')
        setUploadProgress(null)
        return
      }

      setHeaders(result.headers)
      setPreview(result.preview || [])
      setTotalRows(result.totalRows || 0)
      setColumnMappings(result.autoMappings || {})
      setAutoMapped(result.autoMappings || {})
      setUploadProgress(null)
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Error reading file. Please ensure it is a valid CSV or Excel file.')
      setUploadProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMappingChange = (field: string, column: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: column
    }))
  }

  const validateMappings = (): boolean => {
    return requiredFields.every(field => columnMappings[field])
  }

  const validateAccountSelection = (): boolean => {
    return defaultAccount && defaultAccount !== 'Default Account' && defaultAccount.trim() !== ''
  }

  const hasRequiredMappings = validateMappings()
  const hasValidAccount = validateAccountSelection()

  const handleUpload = async () => {
    setShowAccountError(false)
    
    if (!hasValidAccount) {
      setShowAccountError(true)
      setError('Please select an account before uploading transactions.')
      return
    }

    if (!file || !hasRequiredMappings || !session?.user) return

    setIsProcessing(true)
    setError(null)

    try {
      // Phase 1: Parse file
      setUploadProgress({
        phase: 'uploading',
        currentStep: 1,
        totalSteps: 1,
        message: 'Parsing CSV file...',
        processedTransactions: []
      })

      const result = await parseCsvFile(file, columnMappings, {
        defaultCurrency,
        defaultAccount
      })

      if (!result.success || !result.transactions) {
        setError(result.error || 'Failed to process transactions')
        setUploadProgress(null)
        return
      }

      const rawTransactions = result.transactions.map(row => ({
        date: row.date,
        amount: parseFloat(row.amount),
        description: row.description,
        category: row.category || 'Other',
        currency: row.currency || defaultCurrency,
        account: row.account || defaultAccount,
        comment: row.comment
      }))

      console.log(`Starting intelligent categorization of ${rawTransactions.length} transactions`);

      // Phase 2: Progressive categorization with DB lookup and AI fallback
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: rawTransactions.length,
        message: 'Starting categorization: checking database for similar transactions...',
        processedTransactions: []
      })

      const descriptions = rawTransactions.map(t => t.description)
      
      // Use progressive batch processing with responsive UI updates
      const categories = await categorizeTransactionsBatch(
        descriptions, 
        session.user.id,
        (processed, total, results) => {
          // Create processed transactions for real-time progress display
          const processedTransactions = rawTransactions.slice(0, processed).map((transaction, index) => ({
            ...transaction,
            category: results[index] || 'Miscellaneous',
            id: `temp-${index}`,
            user_id: session.user.id
          }))

          setUploadProgress(prev => prev ? {
            ...prev,
            currentStep: processed,
            totalSteps: total,
            message: `Processing ${processed} of ${total} transactions (DB lookup → AI fallback → Save)`,
            processedTransactions
          } : null)
        }
      )

      // Create final processed transactions
      const processedTransactions = rawTransactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index] || 'Miscellaneous',
        id: `temp-${index}`,
        user_id: session.user.id
      }))

      // Phase 3: Save to database
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'saving',
        currentStep: rawTransactions.length,
        totalSteps: rawTransactions.length,
        message: 'Categorization complete! Saving transactions to database...',
        processedTransactions
      } : null)

      // Get account mapping for account names to IDs
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, entities!inner(name)')
        .eq('user_id', session.user.id)
        .eq('type', 'cash');

      if (assetsError) {
        console.error('Error fetching assets for account mapping:', assetsError);
        throw assetsError;
      }

      // Prepare transactions for database insertion with categorization and account_id
      const transactionsForDb = rawTransactions.map((transaction, index) => {
        let accountId = null;
        if (transaction.account && transaction.account !== 'Default Account') {
          const matchingAsset = assets.find(asset => 
            transaction.account.includes(asset.name) && 
            transaction.account.includes(asset.entities.name)
          );
          accountId = matchingAsset?.id || null;
        }

        return {
          user_id: session.user.id,
          description: transaction.description,
          amount: transaction.amount,
          category: categories[index] || 'Miscellaneous',
          date: transaction.date,
          currency: transaction.currency,
          comment: transaction.comment || null,
          account_id: accountId,
        };
      });

      console.log("Inserting transactions to database with intelligent categorization:", transactionsForDb.length);

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsForDb)
        .select();

      if (insertError) {
        console.error('Error inserting transactions:', insertError);
        throw insertError;
      }

      // Phase 4: Update balances
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'updating-balances',
        message: 'Updating account balances...'
      } : null)

      await new Promise(resolve => setTimeout(resolve, 500))

      // Phase 5: Complete
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'complete',
        message: `Successfully processed ${rawTransactions.length} transactions with intelligent categorization!`,
        processedTransactions
      } : null)

      console.log('Intelligent categorization and upload process completed successfully')

      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['assets'] })

      // Call the callback to notify parent component and close dialog
      console.log('Calling onTransactionsUploaded callback')
      onTransactionsUploaded(rawTransactions)

      // Auto-reset after a short delay to show completion
      setTimeout(() => {
        console.log('Auto-resetting form after completion')
        resetForm()
      }, 1500)

    } catch (err) {
      console.error('Error in upload process:', err)
      setError('Failed to upload transactions. Please try again.')
      setUploadProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setUploadProgress(null)
    setFile(null)
    setHeaders([])
    setPreview([])
    setTotalRows(0)
    setColumnMappings({})
    setAutoMapped({})
    setError(null)
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleCancel = () => {
    console.log('Upload cancelled by user')
    setIsProcessing(false)
    setUploadProgress(null)
  }

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
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Transactions
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file containing your transaction data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileUploadSection 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {headers.length > 0 && (
          <>
            <AutoMappingAlert 
              autoMapped={autoMapped}
              hasRequiredMappings={hasRequiredMappings}
            />

            <ColumnMappingSection
              headers={headers}
              mapping={columnMappings}
              onMappingChange={handleMappingChange}
            />

            <DefaultSettingsSection
              defaultCurrency={defaultCurrency}
              setDefaultCurrency={setDefaultCurrency}
              defaultAccount={defaultAccount}
              setDefaultAccount={setDefaultAccount}
              showAccountError={showAccountError}
            />

            <PreviewTable 
              headers={headers}
              preview={preview}
            />

            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={resetForm}
              >
                Clear
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={!hasRequiredMappings || !hasValidAccount || isProcessing}
              >
                {isProcessing ? 'Processing...' : `Upload ${totalRows} Transactions`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
