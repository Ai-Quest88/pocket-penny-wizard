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
import type { CsvUploadProps, Transaction } from "@/types/transaction-forms"

export const CsvUploadForm: React.FC<CsvUploadProps> = ({ onTransactionsUploaded }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0) // Track total number of rows
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [autoMapped, setAutoMapped] = useState<Record<string, string>>({})
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [defaultAccount, setDefaultAccount] = useState('Default Account')

  const requiredFields = ['date', 'amount', 'description']
  const optionalFields = ['category', 'currency', 'account', 'comment']

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsProcessing(true)
    setError(null)

    try {
      const result = await parseCsvFile(selectedFile)
      
      if (!result.success) {
        setError(result.error || 'Unknown error occurred')
        setHeaders([])
        setPreview([])
        setTotalRows(0)
        setColumnMappings({})
        setAutoMapped({})
        return
      }

      if (!result.headers || result.headers.length === 0) {
        setError('No headers found in the file')
        return
      }

      setHeaders(result.headers)
      setPreview(result.preview || [])
      setTotalRows(result.totalRows || 0) // Set the total number of rows
      setColumnMappings(result.autoMappings || {})
      setAutoMapped(result.autoMappings || {})
    } catch (err) {
      console.error('Error processing file:', err)
      setError('Error reading file. Please ensure it is a valid CSV or Excel file.')
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
    if (!file || !hasRequiredMappings) return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await parseCsvFile(file, columnMappings, {
        defaultCurrency,
        defaultAccount
      })

      if (!result.success || !result.transactions) {
        setError(result.error || 'Failed to process transactions')
        return
      }

      const transactions: Omit<Transaction, 'id'>[] = result.transactions.map(row => ({
        date: row.date,
        amount: parseFloat(row.amount),
        description: row.description,
        category: row.category || 'Other',
        currency: row.currency || defaultCurrency,
        account: row.account || defaultAccount,
        comment: row.comment
      }))

      await onTransactionsUploaded(transactions)
      
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
    } catch (err) {
      console.error('Error uploading transactions:', err)
      setError('Failed to upload transactions. Please try again.')
    } finally {
      setIsProcessing(false)
    }
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
