
import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV } from "@/utils/csvParser"
import type { Transaction, CsvUploadProps } from "@/types/transaction-forms"
import { FileUploadSection } from "./csv-upload/FileUploadSection"
import { AutoMappingAlert } from "./csv-upload/AutoMappingAlert"
import { ColumnMappingSection } from "./csv-upload/ColumnMappingSection"
import { PreviewTable } from "./csv-upload/PreviewTable"
import { DefaultSettingsSection } from "./csv-upload/DefaultSettingsSection"

export const CsvUploadForm: React.FC<CsvUploadProps> = ({ onTransactionsUploaded }) => {
  const [file, setFile] = useState<File | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [defaultAccount, setDefaultAccount] = useState('')
  const [autoMapped, setAutoMapped] = useState<Record<string, string>>({})
  const [hasHeaders, setHasHeaders] = useState(false)
  const [showMapping, setShowMapping] = useState(false)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    const fileExtension = uploadedFile.name.toLowerCase()
    const isValidFile = fileExtension.endsWith('.csv') || 
                       fileExtension.endsWith('.xlsx') || 
                       fileExtension.endsWith('.xls')

    if (!isValidFile) {
      setErrors(['Please upload a CSV (.csv), Excel (.xlsx), or Excel 97-2003 (.xls) file'])
      return
    }

    setFile(uploadedFile)
    setErrors([])

    try {
      let csvContent: string = ''
      
      if (fileExtension.endsWith('.csv')) {
        csvContent = await uploadedFile.text()
      } else {
        // Handle Excel files
        try {
          const arrayBuffer = await uploadedFile.arrayBuffer()
          const XLSX = await import('xlsx')
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('No sheets found in Excel file')
          }
          
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          if (!worksheet) {
            throw new Error('Unable to read the first sheet')
          }
          
          csvContent = XLSX.utils.sheet_to_csv(worksheet)
        } catch (excelError) {
          console.error('Excel parsing error:', excelError)
          setErrors(['Error reading Excel file. Please ensure it is a valid Excel file with data in the first sheet.'])
          return
        }
      }
      
      if (!csvContent || csvContent.trim() === '') {
        setErrors(['File appears to be empty or contains no readable data'])
        return
      }
      
      // Use the intelligent parser
      const parseResult = parseCSV(csvContent)
      
      if (parseResult.errors.length > 0) {
        setErrors(parseResult.errors.map(e => `Row ${e.row}: ${e.message}`))
      }
      
      const lines = csvContent.split('\n').filter(line => line.trim())
      if (lines.length < 1) {
        setErrors(['File must contain at least one row of data'])
        return
      }

      // Handle the parsed results
      setHasHeaders(parseResult.hasHeaders || false)
      setAutoMapped(parseResult.autoMappedColumns || {})
      
      let csvHeaders: string[] = []
      
      if (parseResult.hasHeaders && parseResult.autoMappedColumns) {
        // Split the first line to get headers, handling quoted fields
        const firstLine = lines[0]
        csvHeaders = firstLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        setHeaders(csvHeaders)
        setMapping(parseResult.autoMappedColumns)
        
        // Check if we have all required mappings
        const hasRequiredMappings = parseResult.autoMappedColumns.date && 
                                  parseResult.autoMappedColumns.amount && 
                                  parseResult.autoMappedColumns.description
        
        setShowMapping(!hasRequiredMappings)
        
        if (hasRequiredMappings) {
          console.log('Auto-mapping successful! Required fields detected:', parseResult.autoMappedColumns)
        }
      } else {
        // Fall back to manual mapping for files without headers
        const firstLine = lines[0]
        csvHeaders = firstLine.split(',').map((h, index) => h.trim().replace(/^"|"$/g, '') || `Column ${index + 1}`)
        setHeaders(csvHeaders)
        setMapping({})
        setShowMapping(true)
      }

      // Parse first few rows for preview
      const startRow = parseResult.hasHeaders ? 1 : 0
      const previewData = lines.slice(startRow, startRow + 5).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const row: Record<string, string> = {}
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      
      setPreview(previewData)
    } catch (error) {
      console.error('File processing error:', error)
      setErrors(['Error reading file. Please ensure it is a valid CSV or Excel file with proper formatting.'])
    }
  }, [])

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setMapping(prev => ({
      ...prev,
      [targetField]: csvColumn
    }))
  }

  const processTransactions = async () => {
    if (!file || !mapping.date || !mapping.amount || !mapping.description) {
      setErrors(['Please map required fields: Date, Amount, and Description'])
      return
    }

    setIsProcessing(true)
    setErrors([])

    try {
      // For auto-mapped files, we can process directly with parseCSV
      let transactions
      const fileExtension = file.name.toLowerCase()
      
      if (fileExtension.endsWith('.csv')) {
        const content = await file.text()
        const result = parseCSV(content)
        
        if (result.errors.length > 0) {
          setErrors(result.errors.map(e => `Row ${e.row}: ${e.message}`))
          return
        }
        
        transactions = result.transactions.map(tx => ({
          date: tx.date,
          amount: parseFloat(tx.amount),
          description: tx.description,
          category: tx.category,
          currency: tx.currency || defaultCurrency,
          account: defaultAccount || 'Default Account'
        }))
      } else {
        const arrayBuffer = await file.arrayBuffer()
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const csvString = XLSX.utils.sheet_to_csv(worksheet)
        const result = parseCSV(csvString)
        
        if (result.errors.length > 0) {
          setErrors(result.errors.map(e => `Row ${e.row}: ${e.message}`))
          return
        }
        
        transactions = result.transactions.map(tx => ({
          date: tx.date,
          amount: parseFloat(tx.amount),
          description: tx.description,
          category: tx.category,
          currency: tx.currency || defaultCurrency,
          account: defaultAccount || 'Default Account'
        }))
      }
      
      if (transactions.length === 0) {
        setErrors(['No valid transactions found in the file'])
        return
      }

      onTransactionsUploaded(transactions)
      
      // Reset form
      setFile(null)
      setMapping({})
      setHeaders([])
      setPreview([])
      setAutoMapped({})
      setHasHeaders(false)
      setShowMapping(false)
      
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error processing file'])
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setMapping({})
    setHeaders([])
    setPreview([])
    setErrors([])
    setAutoMapped({})
    setHasHeaders(false)
    setShowMapping(false)
  }

  const hasRequiredMappings = mapping.date && mapping.amount && mapping.description

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Transactions
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import multiple transactions at once. Headers will be automatically detected and mapped.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <FileUploadSection 
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
        />

        {file && hasHeaders && (
          <AutoMappingAlert 
            autoMapped={autoMapped}
            hasRequiredMappings={hasRequiredMappings}
          />
        )}

        {file && headers.length > 0 && showMapping && (
          <ColumnMappingSection
            headers={headers}
            mapping={mapping}
            onMappingChange={handleMappingChange}
          />
        )}

        {file && headers.length > 0 && (
          <DefaultSettingsSection
            defaultCurrency={defaultCurrency}
            setDefaultCurrency={setDefaultCurrency}
            defaultAccount={defaultAccount}
            setDefaultAccount={setDefaultAccount}
          />
        )}

        <PreviewTable headers={headers} preview={preview} />

        {file && headers.length > 0 && (
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={processTransactions} 
              disabled={isProcessing || !hasRequiredMappings}
            >
              {isProcessing ? 'Processing...' : 'Import Transactions'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
