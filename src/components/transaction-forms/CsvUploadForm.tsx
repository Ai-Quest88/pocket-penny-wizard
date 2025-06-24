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
import { AccountSelectionSection } from "./csv-upload/AccountSelectionSection"
import { ProgressiveUpload } from "./ProgressiveUpload"
import { categorizeTransactionsBatch } from "@/utils/aiCategorization"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAccounts } from "@/hooks/useAccounts"
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
  const [defaultSettings, setDefaultSettings] = useState({
    description: '',
    currency: 'AUD',
    category: 'Other'
  })
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [showAccountError, setShowAccountError] = useState(false)
  
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { accounts } = useAccounts()

  const requiredFields = ['date', 'amount', 'description']

  const handleFileUpload = (data: any[], fileHeaders: string[]) => {
    setFile(null) // We don't need the file object in this simplified version
    setIsProcessing(false)
    setError(null)

    if (!fileHeaders || fileHeaders.length === 0) {
      setError('No headers found in the file')
      return
    }

    setHeaders(fileHeaders)
    setPreview(data.slice(0, 5) || [])
    setTotalRows(data.length || 0)
    
    // Auto-map columns
    const autoMappings: Record<string, string> = {}
    fileHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase()
      if (lowerHeader.includes('description') || lowerHeader.includes('narration')) {
        autoMappings.description = header
      } else if (lowerHeader.includes('amount')) {
        autoMappings.amount = header
      } else if (lowerHeader.includes('date')) {
        autoMappings.date = header
      }
    })
    
    setColumnMappings(autoMappings)
    setAutoMapped(autoMappings)
  }

  const handleMappingChange = (field: string, column: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: column
    }))
  }

  const handleDefaultSettingsChange = (field: string, value: string) => {
    setDefaultSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAcceptAutoMapping = () => {
    setColumnMappings(autoMapped)
  }

  const validateMappings = (): boolean => {
    return requiredFields.every(field => columnMappings[field])
  }

  const validateAccountSelection = (): boolean => {
    return selectedAccountId !== null
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

    if (!hasRequiredMappings || !session?.user) return

    setIsProcessing(true)
    setError(null)

    try {
      // Simple upload process - you can extend this as needed
      const transactionsToInsert = preview.map((row) => {
        const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null
        
        return {
          user_id: session.user.id,
          description: String(row[columnMappings.description] || defaultSettings.description || 'Unknown transaction'),
          amount: Number(row[columnMappings.amount] || 0),
          date: String(row[columnMappings.date] || new Date().toISOString().split('T')[0]),
          currency: String(row[columnMappings.currency] || defaultSettings.currency || 'AUD'),
          category: String(row[columnMappings.category] || defaultSettings.category || 'Other'),
          asset_account_id: selectedAccount?.accountType === 'asset' ? selectedAccountId : null,
          liability_account_id: selectedAccount?.accountType === 'liability' ? selectedAccountId : null,
        }
      })

      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)

      if (insertError) {
        throw insertError
      }

      // Refresh queries
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['assets'] })
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] })

      // Call the callback to notify parent component
      onTransactionsUploaded(transactionsToInsert)

      // Reset form
      resetForm()

    } catch (err) {
      console.error('Error in upload process:', err)
      setError('Failed to upload transactions. Please try again.')
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
    setSelectedAccountId(null)
  }

  const handleCancel = () => {
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
              autoMappedColumns={autoMapped}
              onAcceptMapping={handleAcceptAutoMapping}
            />

            <ColumnMappingSection
              headers={headers}
              mappings={columnMappings}
              onMappingChange={handleMappingChange}
            />

            <AccountSelectionSection
              selectedAccountId={selectedAccountId}
              onAccountChange={setSelectedAccountId}
            />

            <PreviewTable
              data={preview}
              mappings={{
                description: columnMappings.description || '',
                amount: columnMappings.amount || '',
                date: columnMappings.date || '',
                currency: '',
                category: ''
              }}
              defaultSettings={defaultSettings}
              selectedAccount={selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null}
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
