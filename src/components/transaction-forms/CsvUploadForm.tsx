import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Upload, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCsvFile, parseExcelFile } from "@/utils/csvParser"
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
      let lines: string[] = []
      
      if (fileExtension.endsWith('.csv')) {
        // Handle CSV files
        const text = await uploadedFile.text()
        lines = text.split('\n').filter(line => line.trim())
      } else {
        // Handle Excel files
        const arrayBuffer = await uploadedFile.arrayBuffer()
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert to CSV format for consistent processing
        const csvString = XLSX.utils.sheet_to_csv(worksheet)
        lines = csvString.split('\n').filter(line => line.trim())
      }
      
      if (lines.length < 2) {
        setErrors(['File must contain at least a header row and one data row'])
        return
      }

      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      console.log("Raw headers:", csvHeaders)
      
      // Comprehensive filtering for headers
      const filteredHeaders = csvHeaders.filter(h => {
        const isValid = h && typeof h === 'string' && h.trim() !== '' && h.trim() !== 'undefined' && h.trim() !== 'null'
        if (!isValid) {
          console.warn("Filtered out invalid header:", h)
        }
        return isValid
      })
      
      console.log("Filtered headers:", filteredHeaders)
      setHeaders(filteredHeaders)

      // Parse first few rows for preview
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        filteredHeaders.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      
      setPreview(previewData)
    } catch (error) {
      setErrors(['Error reading file. Please ensure it is a valid CSV or Excel file.'])
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
      let transactions
      const fileExtension = file.name.toLowerCase()
      
      if (fileExtension.endsWith('.csv')) {
        transactions = await parseCsvFile(file, mapping, defaultCurrency, defaultAccount)
      } else {
        transactions = await parseExcelFile(file, mapping, defaultCurrency, defaultAccount)
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
    
    if (!isValid) {
      console.error("Invalid header detected in validHeaders:", header, typeof header)
    }
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
    
    if (!isValid) {
      console.error("Invalid account detected:", account)
    }
    return isValid
  })

  // Debug logging before render
  console.log("FileUploadForm render - validHeaders:", validHeaders)
  console.log("FileUploadForm render - validAccounts:", validAccounts)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Transactions
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import multiple transactions at once
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

        {file && validHeaders.length > 0 && (
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
                    {validHeaders.map(header => {
                      // Final safety check before rendering
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in date mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`date-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
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
                    {validHeaders.map(header => {
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in amount mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`amount-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
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
                    {validHeaders.map(header => {
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in description mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`description-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
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
                    {validHeaders.map(header => {
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in category mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`category-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
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
                    {validHeaders.map(header => {
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in account mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`account-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
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
                    {validHeaders.map(header => {
                      if (!header || header.trim() === '') {
                        console.error("Attempting to render empty header in currency mapping:", header)
                        return null
                      }
                      return (
                        <SelectItem key={`currency-${header}`} value={header}>{header}</SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                    {validAccounts.map(account => {
                      if (!account.name || account.name.trim() === '' || !account.id || account.id.trim() === '') {
                        console.error("Attempting to render invalid account:", account)
                        return null
                      }
                      return (
                        <SelectItem key={account.id} value={account.name}>
                          {account.name} ({account.type})
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
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
            }}>
              Cancel
            </Button>
            <Button 
              onClick={processTransactions} 
              disabled={isProcessing || !mapping.date || !mapping.amount || !mapping.description}
            >
              {isProcessing ? 'Processing...' : 'Import Transactions'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
