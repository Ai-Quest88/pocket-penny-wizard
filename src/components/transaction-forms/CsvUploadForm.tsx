
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
import { categorizeBatchTransactions } from "@/utils/transactionCategories"
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
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [defaultAccount, setDefaultAccount] = useState('Default Account')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const requiredFields = ['date', 'amount', 'description']
  const optionalFields = ['category', 'currency', 'account', 'comment']

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

      console.log(`Starting categorization of ${rawTransactions.length} transactions`)

      // Phase 2: Categorize transactions with improved batch processing
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: rawTransactions.length,
        message: 'Starting AI categorization...',
        processedTransactions: []
      })

      const processedTransactions: any[] = []
      const descriptions = rawTransactions.map(t => t.description)
      
      // Process in smaller batches for better progress tracking
      const batchSize = 5
      let completedCount = 0

      for (let i = 0; i < descriptions.length; i += batchSize) {
        const endIndex = Math.min(i + batchSize, descriptions.length)
        const batchDescriptions = descriptions.slice(i, endIndex)
        const batchTransactions = rawTransactions.slice(i, endIndex)
        
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(descriptions.length/batchSize)}`)
        
        try {
          // Categorize the current batch
          const categories = await categorizeBatchTransactions(batchDescriptions, session.user.id, 1, 1)
          
          // Process each transaction in the batch
          for (let j = 0; j < batchTransactions.length; j++) {
            const transaction = batchTransactions[j]
            const updatedTransaction = {
              ...transaction,
              category: categories[j] || 'Miscellaneous',
              id: `temp-${i + j}`,
              user_id: session.user.id
            }
            processedTransactions.push(updatedTransaction)
            completedCount++

            // Update progress after each transaction
            setUploadProgress(prev => prev ? {
              ...prev,
              currentStep: completedCount,
              processedTransactions: [...processedTransactions],
              message: `Categorized ${completedCount} of ${descriptions.length} transactions...`
            } : null)

            // Small delay to show progress visually
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (error) {
          console.error('Error categorizing batch:', error)
          // Continue with default categories on error
          for (let j = 0; j < batchTransactions.length; j++) {
            const transaction = batchTransactions[j]
            processedTransactions.push({
              ...transaction,
              category: 'Miscellaneous',
              id: `temp-${i + j}`,
              user_id: session.user.id
            })
            completedCount++
          }
          
          setUploadProgress(prev => prev ? {
            ...prev,
            currentStep: completedCount,
            processedTransactions: [...processedTransactions],
            message: `Processing ${completedCount} of ${descriptions.length} transactions...`
          } : null)
        }

        // Longer delay between batches to prevent overwhelming the API
        if (endIndex < descriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      console.log(`Categorization complete. Processed ${processedTransactions.length} transactions`)

      // Phase 3: Save to database
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'saving',
        currentStep: 0,
        totalSteps: 1,
        message: 'Saving transactions to database...'
      } : null)

      // Call the upload handler
      await onTransactionsUploaded(rawTransactions)

      // Phase 4: Update balances (handled by parent component)
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'updating-balances',
        currentStep: 0,
        totalSteps: 1,
        message: 'Updating account balances...'
      } : null)

      // Small delay to show the updating phase
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Phase 5: Complete
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'complete',
        currentStep: 1,
        totalSteps: 1,
        message: `Successfully processed ${rawTransactions.length} transactions!`,
        processedTransactions: processedTransactions
      } : null)

      console.log('Upload process completed successfully')

      // Refresh queries immediately
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['assets'] })

      // Auto-reset after showing completion for 3 seconds
      setTimeout(() => {
        console.log('Auto-resetting form after completion')
        resetForm()
      }, 3000)

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
