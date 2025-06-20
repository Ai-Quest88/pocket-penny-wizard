
import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

interface FileUploadSectionProps {
  onFileUpload: (data: any[], fileHeaders: string[]) => void
  isProcessing: boolean
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  isProcessing
}) => {
  const downloadTemplate = () => {
    const template = 'Date,Amount,Description,Category,Currency\n2024-01-01,-50.00,Coffee Shop,Food & Dining,AUD\n2024-01-02,2000.00,Salary,Income,AUD'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Simple CSV parsing for demo purposes
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    const data = lines.slice(1).map(line => {
      const values = line.split(',')
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || ''
      })
      return row
    })

    onFileUpload(data, headers)
  }

  return (
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
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: CSV (.csv), Excel (.xlsx), Excel 97-2003 (.xls)
      </p>
    </div>
  )
}
