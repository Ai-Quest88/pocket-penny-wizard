
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
import { categorizeTransactionWithAI } from "@/utils/aiCategorization"
import { categorizeByBuiltInRules } from "@/utils/transactionCategories"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
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

  const hasRequiredMappings = validateMappings()

  // Fast parallel categorization function
  const categorizeTransactionsParallel = async (descriptions: string[]): Promise<string[]> => {
    console.log(`Starting ultra-fast parallel categorization of ${descriptions.length} transactions`)
    
    // First pass: Apply built-in rules (instant)
    const categorizedResults = descriptions.map(desc => {
      const builtInCategory = categorizeByBuiltInRules(desc)
      return { description: desc, category: builtInCategory, needsAI: !builtInCategory }
    })

    const needsAICount = categorizedResults.filter(r => r.needsAI).length
    console.log(`Built-in rules handled ${descriptions.length - needsAICount} transactions, ${needsAICount} need AI`)

    if (needsAICount === 0) {
      return categorizedResults.map(r => r.category || 'Miscellaneous')
    }

    // Second pass: AI categorization in true parallel (no delays, no batching)
    setUploadProgress(prev => prev ? {
      ...prev,
      message: `AI categorizing ${needsAICount} transactions in parallel...`
    } : null)

    const aiPromises = categorizedResults.map(async (result, index) => {
      if (!result.needsAI) return result.category

      try {
        const aiCategory = await categorizeTransactionWithAI(result.description)
        
        // Update progress every 10 completed items for better performance
        if (index % 10 === 0) {
          setUploadProgress(prev => prev ? {
            ...prev,
            currentStep: Math.min(prev.currentStep + 10, prev.totalSteps),
            message: `AI categorized ${Math.min(index + 10, needsAICount)} of ${needsAICount} transactions...`
          } : null)
        }
        
        return aiCategory || 'Miscellaneous'
      } catch (error) {
        console.warn('AI categorization failed for:', result.description, error)
        return 'Miscellaneous'
      }
    })

    // Execute all AI calls in parallel with no artificial delays
    const finalCategories = await Promise.all(aiPromises)
    console.log(`Ultra-fast parallel categorization completed in seconds`)
    
    return finalCategories
  }

  const handleUpload = async () => {
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

      console.log(`Starting ultra-fast processing of ${rawTransactions.length} transactions`)

      // Phase 2: Ultra-fast parallel categorization
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: rawTransactions.length,
        message: 'Starting ultra-fast AI categorization...',
        processedTransactions: []
      })

      const descriptions = rawTransactions.map(t => t.description)
      const categories = await categorizeTransactionsParallel(descriptions)

      // Create final processed transactions
      const processedTransactions = rawTransactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index] || 'Miscellaneous',
        id: `temp-${index}`,
        user_id: session.user.id
      }))

      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'saving',
        currentStep: rawTransactions.length,
        totalSteps: rawTransactions.length,
        message: 'Categorization complete! Saving to database...',
        processedTransactions
      } : null)

      // Phase 3: Save to database
      await onTransactionsUploaded(rawTransactions)

      // Phase 4: Update balances
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'updating-balances',
        message: 'Updating account balances...'
      } : null)

      // Small delay to show the updating phase
      await new Promise(resolve => setTimeout(resolve, 300))

      // Phase 5: Complete
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'complete',
        message: `Successfully processed ${rawTransactions.length} transactions in record time!`,
        processedTransactions
      } : null)

      console.log('Ultra-fast upload process completed successfully')

      // Refresh queries immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['assets'] })

      // Auto-reset after showing completion for 1.5 seconds
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
    
    // Reset file input
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
                disabled={!hasRequiredMappings || isProcessing}
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
