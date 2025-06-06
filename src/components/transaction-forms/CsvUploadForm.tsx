import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Upload, Download, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCSV } from "@/utils/csvParser"
import { categories } from "@/types/transaction-forms"
import { useAccounts } from "@/hooks/useAccounts"
import type { Transaction, CsvUploadProps } from "@/types/transaction-forms"

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
  
  const { accounts, isLoading: accountsLoading } = useAccounts()

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

  const downloadTemplate = () => {
    const template = 'Date,Amount,Description,Category,Account\n2024-01-01,-50.00,Coffee Shop,Food & Dining,Main Account\n2024-01-02,2000.00,Salary,Income,Main Account'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Enhanced filtering for headers with additional safety checks
  const validHeaders = headers.filter(header => {
    const isValid = header && 
                   typeof header === 'string' && 
                   header.trim() !== '' && 
                   header.trim() !== 'undefined' && 
                   header.trim() !== 'null' &&
                   header.length > 0
    return isValid
  })
  
  // Enhanced filtering for accounts with additional safety checks
  const validAccounts = accounts.filter(account => {
    const isValid = account && 
                   account.name && 
                   typeof account.name === 'string' && 
                   account.name.trim() !== '' &&
                   account.name.trim() !== 'undefined' &&
                   account.name.trim() !== 'null' &&
                   account.id &&
                   typeof account.id === 'string' &&
                   account.id.trim() !== ''
    return isValid
  })

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="file-upload">Select File</Label>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV Template
            </Button>
          </div>
          
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: CSV (.csv), Excel (.xlsx), Excel 97-2003 (.xls)
          </p>
        </div>

        {file && hasHeaders && Object.keys(autoMapped).length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Headers detected and automatically mapped:</p>
                <ul className="text-sm space-y-1">
                  {Object.entries(autoMapped).map(([field, column]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {column}
                    </li>
                  ))}
                </ul>
                {hasRequiredMappings ? (
                  <p className="text-green-600 font-medium">✓ All required fields mapped successfully!</p>
                ) : (
                  <p className="text-amber-600">Some required fields need manual mapping below.</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {file && validHeaders.length > 0 && showMapping && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Map File Columns</h3>
            <p className="text-sm text-muted-foreground">
              Map your file columns to transaction fields. Required fields are marked with *
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-mapping">Date *</Label>
                <Select value={mapping.date || ''} onValueChange={(value) => handleMappingChange(value, 'date')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {validHeaders.map(header => (
                      <SelectItem key={`date-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount-mapping">Amount *</Label>
                <Select value={mapping.amount || ''} onValueChange={(value) => handleMappingChange(value, 'amount')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount column" />
                  </SelectTrigger>
                  <SelectContent>
                    {validHeaders.map(header => (
                      <SelectItem key={`amount-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description-mapping">Description *</Label>
                <Select value={mapping.description || ''} onValueChange={(value) => handleMappingChange(value, 'description')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select description column" />
                  </SelectTrigger>
                  <SelectContent>
                    {validHeaders.map(header => (
                      <SelectItem key={`description-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category-mapping">Category</Label>
                <Select value={mapping.category || ''} onValueChange={(value) => handleMappingChange(value, 'category')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {validHeaders.map(header => (
                      <SelectItem key={`category-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="account-mapping">Account</Label>
                <Select value={mapping.account || ''} onValueChange={(value) => handleMappingChange(value, 'account')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {validHeaders.map(header => (
                      <SelectItem key={`account-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency-mapping">Currency</Label>
                <Select value={mapping.currency || ''} onValueChange={(value) => handleMappingChange(value, 'currency')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {validHeaders.map(header => (
                      <SelectItem key={`currency-${header}`} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {file && validHeaders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-currency">Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="default-account">Default Account</Label>
              <Select value={defaultAccount} onValueChange={setDefaultAccount} disabled={accountsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default account" />
                </SelectTrigger>
                <SelectContent>
                  {validAccounts.map(account => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    {validHeaders.map(header => (
                      <th key={`preview-header-${header}`} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={`preview-row-${index}`}>
                      {validHeaders.map(header => (
                        <td key={`preview-cell-${index}-${header}`} className="border border-gray-300 px-3 py-2 text-sm">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {file && validHeaders.length > 0 && (
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => {
              setFile(null)
              setMapping({})
              setHeaders([])
              setPreview([])
              setErrors([])
              setAutoMapped({})
              setHasHeaders(false)
              setShowMapping(false)
            }}>
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
