import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload, Download, InfoIcon, Database, Zap } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { parseCsvFile } from "@/utils/csvParser"
import { categorizeTransactionsBatch } from "@/utils/aiCategorization"
import { insertTransactionsWithDuplicateCheck } from "@/components/transaction-forms/csv-upload/helpers/transactionInsertion"
import { useAuth } from "@/contexts/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface UnifiedCsvUploadProps {
  onSuccess?: () => void;
}

interface UploadProgress {
  phase: 'parsing' | 'categorizing' | 'saving' | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
}

const mockTransactions = [
  { date: '2024-01-15', amount: -45.50, description: 'Starbucks Coffee Shop', category: 'Food & Dining' },
  { date: '2024-01-14', amount: -120.00, description: 'Woolworths Supermarket', category: 'Groceries' },
  { date: '2024-01-13', amount: 2500.00, description: 'Salary Payment - ABC Corp', category: 'Income' },
  { date: '2024-01-12', amount: -85.75, description: 'Shell Gas Station', category: 'Transportation' },
  { date: '2024-01-11', amount: -15.99, description: 'Netflix Subscription', category: 'Entertainment' },
  { date: '2024-01-10', amount: -67.80, description: 'Chemist Warehouse', category: 'Health & Medical' },
  { date: '2024-01-09', amount: -250.00, description: 'Electricity Bill - Origin Energy', category: 'Utilities' },
  { date: '2024-01-08', amount: -32.50, description: 'McDonald\'s Restaurant', category: 'Food & Dining' },
  { date: '2024-01-07', amount: -89.99, description: 'Amazon Online Purchase', category: 'Shopping' },
  { date: '2024-01-06', amount: 150.00, description: 'Freelance Work Payment', category: 'Income' },
  { date: '2024-01-05', amount: -78.25, description: 'Bunnings Hardware Store', category: 'Home & Garden' },
  { date: '2024-01-04', amount: -25.00, description: 'Uber Ride', category: 'Transportation' },
];

const UnifiedCsvUpload: React.FC<UnifiedCsvUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [autoMapped, setAutoMapped] = useState<Record<string, string>>({})
  const [defaultCurrency, setDefaultCurrency] = useState('AUD')
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const requiredFields = ['date', 'amount', 'description']

  const handleMockDataUpload = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create mock transactions",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      console.log(`Creating ${mockTransactions.length} mock transactions`);

      // Phase 1: Show parsing phase
      setUploadProgress({
        phase: 'parsing',
        currentStep: 1,
        totalSteps: mockTransactions.length,
        message: 'Preparing mock transaction data...'
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      // Phase 2: Categorize transactions
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: mockTransactions.length,
        message: 'Categorizing transactions with AI...'
      })

      const descriptions = mockTransactions.map(t => t.description)
      const categories = await categorizeTransactionsBatch(
        descriptions, 
        session.user.id,
        (processed, total) => {
          setUploadProgress({
            phase: 'categorizing',
            currentStep: processed,
            totalSteps: total,
            message: `Categorizing ${processed} of ${total} transactions...`
          })
        }
      )

      // Apply categories to transactions
      const categorizedTransactions = mockTransactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index] || transaction.category || 'Miscellaneous',
        currency: defaultCurrency,
        user_id: session.user.id,
        account_id: null,
      }))

      // Phase 3: Save to database
      setUploadProgress({
        phase: 'saving',
        currentStep: 0,
        totalSteps: categorizedTransactions.length,
        message: 'Saving transactions to database...'
      })

      let result_summary;
      if (duplicateCheckEnabled) {
        result_summary = await insertTransactionsWithDuplicateCheck(categorizedTransactions)
      } else {
        // Direct insertion without duplicate checking
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(categorizedTransactions)

        if (insertError) {
          throw insertError
        }

        result_summary = { inserted: categorizedTransactions.length, duplicates: 0 }
      }

      // Phase 4: Complete
      setUploadProgress({
        phase: 'complete',
        currentStep: categorizedTransactions.length,
        totalSteps: categorizedTransactions.length,
        message: `Successfully created ${result_summary.inserted} mock transactions!`
      })

      console.log(`Mock data creation completed: ${result_summary.inserted} inserted, ${result_summary.duplicates} duplicates skipped`);

      if (result_summary.inserted > 0) {
        toast({
          title: "Success",
          description: `Successfully created ${result_summary.inserted} mock transactions${result_summary.duplicates > 0 ? ` (${result_summary.duplicates} duplicates skipped)` : ''}`,
        })
      } else if (result_summary.duplicates > 0) {
        toast({
          title: "Info",
          description: `All ${result_summary.duplicates} mock transactions were duplicates and skipped`,
        })
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // Auto-reset after success
      setTimeout(() => {
        resetForm()
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)

    } catch (err) {
      console.error('Error creating mock transactions:', err)
      setError('Failed to create mock transactions. Please try again.')
      setUploadProgress(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    if (!selectedFile) return

    setFile(selectedFile)
    handleFileUpload(selectedFile)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  })

  const handleFileUpload = async (selectedFile: File) => {
    setIsProcessing(true)
    setError(null)
    setUploadProgress({
      phase: 'parsing',
      currentStep: 1,
      totalSteps: 1,
      message: 'Reading and parsing file...'
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

  const downloadTemplate = () => {
    const template = 'Date,Amount,Description,Category,Currency\n01/01/2024,-50.00,Coffee Shop,Food & Dining,AUD\n02/01/2024,2000.00,Salary,Income,AUD'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload transactions",
        variant: "destructive",
      })
      return
    }

    if (!validateMappings()) {
      toast({
        title: "Mapping Error",
        description: "Please map all required headers (Date, Description, Amount)",
        variant: "destructive",
      })
      return
    }

    if (!file) {
      toast({
        title: "File Error",
        description: "No file selected",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Phase 1: Parse file with mappings
      setUploadProgress({
        phase: 'parsing',
        currentStep: 1,
        totalSteps: totalRows,
        message: 'Parsing CSV file...'
      })

      const result = await parseCsvFile(file, columnMappings, {
        defaultCurrency,
        defaultAccount: 'Default Account'
      })

      if (!result.success || !result.transactions) {
        setError(result.error || 'Failed to process transactions')
        setUploadProgress(null)
        return
      }

      const rawTransactions = result.transactions.map(row => ({
        date: row.date,
        description: row.description,
        amount: parseFloat(row.amount),
        currency: row.currency || defaultCurrency,
        category: row.category || 'Other',
        user_id: session.user.id,
        account_id: null,
      })).filter(t => t.date && t.description && !isNaN(t.amount))

      if (rawTransactions.length === 0) {
        setError('No valid transactions found in the file.')
        setUploadProgress(null)
        return
      }

      console.log(`Processing ${rawTransactions.length} transactions`);

      // Phase 2: Categorize transactions
      setUploadProgress({
        phase: 'categorizing',
        currentStep: 0,
        totalSteps: rawTransactions.length,
        message: 'Categorizing transactions with AI...'
      })

      const descriptions = rawTransactions.map(t => t.description)
      const categories = await categorizeTransactionsBatch(
        descriptions, 
        session.user.id,
        (processed, total) => {
          setUploadProgress({
            phase: 'categorizing',
            currentStep: processed,
            totalSteps: total,
            message: `Categorizing ${processed} of ${total} transactions...`
          })
        }
      )

      // Apply categories to transactions
      const categorizedTransactions = rawTransactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index] || 'Miscellaneous',
      }))

      // Phase 3: Save to database
      setUploadProgress({
        phase: 'saving',
        currentStep: 0,
        totalSteps: categorizedTransactions.length,
        message: 'Saving transactions to database...'
      })

      let result_summary;
      if (duplicateCheckEnabled) {
        result_summary = await insertTransactionsWithDuplicateCheck(categorizedTransactions)
      } else {
        // Direct insertion without duplicate checking
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(categorizedTransactions)

        if (insertError) {
          throw insertError
        }

        result_summary = { inserted: categorizedTransactions.length, duplicates: 0 }
      }

      // Phase 4: Complete
      setUploadProgress({
        phase: 'complete',
        currentStep: categorizedTransactions.length,
        totalSteps: categorizedTransactions.length,
        message: `Successfully processed ${result_summary.inserted} transactions!`
      })

      console.log(`Upload completed: ${result_summary.inserted} inserted, ${result_summary.duplicates} duplicates skipped`);

      if (result_summary.inserted > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result_summary.inserted} transactions${result_summary.duplicates > 0 ? ` (${result_summary.duplicates} duplicates skipped)` : ''}`,
        })
      } else if (result_summary.duplicates > 0) {
        toast({
          title: "Info",
          description: `All ${result_summary.duplicates} transactions were duplicates and skipped`,
        })
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })

      // Auto-reset after success
      setTimeout(() => {
        resetForm()
        if (onSuccess) {
          onSuccess()
        }
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
  }

  const validHeaders = headers.filter(header => {
    return header && 
           typeof header === 'string' && 
           header.trim() !== '' && 
           header.trim() !== 'undefined' && 
           header.trim() !== 'null' &&
           header.length > 0
  })

  const hasRequiredMappings = validateMappings()

  // Show progress UI when processing
  if (uploadProgress) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {uploadProgress.phase === 'parsing' && 'Parsing Data'}
                {uploadProgress.phase === 'categorizing' && 'Categorizing Transactions'}
                {uploadProgress.phase === 'saving' && 'Saving to Database'}
                {uploadProgress.phase === 'complete' && 'Complete'}
              </h3>
              <div className="text-sm text-muted-foreground">
                {uploadProgress.phase !== 'parsing' && `${uploadProgress.currentStep}/${uploadProgress.totalSteps}`}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: uploadProgress.phase === 'parsing' 
                      ? '25%' 
                      : uploadProgress.phase === 'categorizing'
                      ? `${25 + (uploadProgress.currentStep / uploadProgress.totalSteps) * 50}%`
                      : uploadProgress.phase === 'saving'
                      ? '90%'
                      : '100%'
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{uploadProgress.message}</p>
            </div>

            {uploadProgress.phase === 'complete' && (
              <div className="flex justify-center">
                <div className="text-green-600 text-2xl">✓</div>
              </div>
            )}
          </div>
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
          Upload a CSV or Excel file containing your transaction data, or create mock transactions for testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Actions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Quick Actions</Label>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={handleMockDataUpload}
              disabled={isProcessing}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Database className="h-4 w-4" />
              Create Mock Transactions
            </Button>
          </div>
          
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Use "Create Mock Transactions" to instantly add 12 sample transactions for testing the app without uploading a CSV file.
            </AlertDescription>
          </Alert>
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <Label>Or Upload CSV/Excel File</Label>
          
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-md p-6 cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent'
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isDragActive 
                  ? "Drop the file here..." 
                  : "Drag 'n' drop a file here, or click to select"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Supported: CSV (.csv), Excel (.xlsx, .xls) - Max 10MB
              </p>
              {file && (
                <p className="text-sm text-primary mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {headers.length > 0 && (
          <>
            {/* Auto-mapping Alert */}
            {Object.keys(autoMapped).length > 0 && (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Auto-detected column mappings: {Object.entries(autoMapped).map(([field, column]) => 
                    `${field} → ${column}`
                  ).join(', ')}. Please review and adjust if needed.
                </AlertDescription>
              </Alert>
            )}

            {/* Column Mapping Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Map File Columns</h3>
              <p className="text-sm text-muted-foreground">
                Map your file columns to transaction fields. Required fields are marked with *
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-mapping">Date *</Label>
                  <Select value={columnMappings.date || ''} onValueChange={(value) => handleMappingChange('date', value)}>
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
                  <Select value={columnMappings.amount || ''} onValueChange={(value) => handleMappingChange('amount', value)}>
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
                  <Select value={columnMappings.description || ''} onValueChange={(value) => handleMappingChange('description', value)}>
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
                  <Label htmlFor="currency-mapping">Currency (Optional)</Label>
                  <Select value={columnMappings.currency || ''} onValueChange={(value) => handleMappingChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency column (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (use default)</SelectItem>
                      {validHeaders.map(header => (
                        <SelectItem key={`currency-${header}`} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Default Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Default Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="default-currency">Default Currency</Label>
                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Input
                    type="checkbox"
                    id="duplicateCheck"
                    checked={duplicateCheckEnabled}
                    onChange={(e) => setDuplicateCheckEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="duplicateCheck">Enable intelligent duplicate detection</Label>
                </div>
              </div>

              {duplicateCheckEnabled && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    Duplicate detection is enabled. Transactions with the same description, amount, and date will be automatically skipped.
                    Similar transactions (80%+ similarity) will also be detected and skipped.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Preview Table */}
            {preview.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview (first 5 rows)</h3>
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={isProcessing}
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

export default UnifiedCsvUpload
