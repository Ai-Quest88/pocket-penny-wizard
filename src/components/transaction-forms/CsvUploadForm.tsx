import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Upload, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { parseCsvFile } from "@/utils/csvParser"
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

    if (!uploadedFile.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file'])
      return
    }

    setFile(uploadedFile)
    setErrors([])

    try {
      const text = await uploadedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setErrors(['CSV file must contain at least a header row and one data row'])
        return
      }

      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setHeaders(csvHeaders)

      // Parse first few rows for preview
      const previewData = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        csvHeaders.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      
      setPreview(previewData)
    } catch (error) {
      setErrors(['Error reading CSV file'])
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
      const transactions = await parseCsvFile(file, mapping, defaultCurrency, defaultAccount)
      
      if (transactions.length === 0) {
        setErrors(['No valid transactions found in the CSV file'])
        return
      }

      onTransactionsUploaded(transactions)
      
      // Reset form
      setFile(null)
      setMapping({})
      setHeaders([])
      setPreview([])
      
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Error processing CSV file'])
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV Transactions
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import multiple transactions at once
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
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </div>

        {file && headers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Map CSV Columns</h3>
            <p className="text-sm text-muted-foreground">
              Map your CSV columns to transaction fields. Required fields are marked with *
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-mapping">Date *</Label>
                <Select value={mapping.date || ''} onValueChange={(value) => handleMappingChange(value, 'date')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
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
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
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
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
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
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.name}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
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
                    {headers.map(header => (
                      <th key={header} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {headers.map(header => (
                        <td key={header} className="border border-gray-300 px-3 py-2 text-sm">
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

        {file && headers.length > 0 && (
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
