
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

      // Phase 2: Categorize transactions with progress updates
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: rawTransactions.length,
        message: 'Categorizing transactions with AI...',
        processedTransactions: []
      })

      const descriptions = rawTransactions.map(t => t.description)
      const processedTransactions: any[] = []

      // Process transactions in batches with progress updates
      const batchSize = 3
      for (let i = 0; i < descriptions.length; i += batchSize) {
        const batch = descriptions.slice(i, i + batchSize)
        const batchTransactions = rawTransactions.slice(i, i + batchSize)
        
        try {
          const categories = await categorizeBatchTransactions([batch[0]], session.user.id, 1, 1)
          
          // Update each transaction in the batch with its category
          batchTransactions.forEach((transaction, batchIndex) => {
            const updatedTransaction = {
              ...transaction,
              category: categories[batchIndex] || 'Miscellaneous',
              id: `temp-${i + batchIndex}` // Temporary ID for display
            }
            processedTransactions.push(updatedTransaction)
          })

          // Update progress with real-time transaction display
          setUploadProgress(prev => prev ? {
            ...prev,
            currentStep: Math.min(i + batchSize, descriptions.length),
            processedTransactions: [...processedTransactions],
            message: `Categorized ${Math.min(i + batchSize, descriptions.length)} of ${descriptions.length} transactions...`
          } : null)

          // Force a small delay to show progress visually
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error('Error categorizing batch:', error)
          // Continue with default category for failed batches
          batchTransactions.forEach((transaction, batchIndex) => {
            processedTransactions.push({
              ...transaction,
              category: 'Miscellaneous',
              id: `temp-${i + batchIndex}`
            })
          })
          
          // Update progress even on error
          setUploadProgress(prev => prev ? {
            ...prev,
            currentStep: Math.min(i + batchSize, descriptions.length),
            processedTransactions: [...processedTransactions],
            message: `Processing ${Math.min(i + batchSize, descriptions.length)} of ${descriptions.length} transactions...`
          } : null)
        }
      }

      // Phase 3: Save to database
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'saving',
        currentStep: 0,
        totalSteps: 1,
        message: 'Saving transactions to database...'
      } : null)

      await onTransactionsUploaded(rawTransactions)

      // Phase 4: Complete
      setUploadProgress(prev => prev ? {
        ...prev,
        phase: 'complete',
        currentStep: 1,
        totalSteps: 1,
        message: `Successfully processed ${rawTransactions.length} transactions!`,
        processedTransactions: processedTransactions
      } : null)

      // Refresh the main transaction list immediately
      queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // Auto-hide progress after 3 seconds to allow user to see completion
      setTimeout(() => {
        setUploadProgress(null)
        // Reset form
        setFile(null)
        setHeaders([])
        setPreview([])
        setTotalRows(0)
        setColumnMappings({})
        setAutoMapped({})
        
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) {
          fileInput.value = ''
        }
      }, 3000)

    } catch (err) {
      console.error('Error uploading transactions:', err)
      setError('Failed to upload transactions. Please try again.')
      setUploadProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  // Show progressive upload UI when processing
  if (uploadProgress) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <ProgressiveUpload 
            progress={uploadProgress}
            onCancel={() => {
              setUploadProgress(null)
              setIsProcessing(false)
            }}
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
                onClick={() => {
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
                }}
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
