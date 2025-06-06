
import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

interface FileUploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  isProcessing: boolean
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  isProcessing
}) => {
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
        onChange={onFileUpload}
        disabled={isProcessing}
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: CSV (.csv), Excel (.xlsx), Excel 97-2003 (.xls)
      </p>
    </div>
  )
}
