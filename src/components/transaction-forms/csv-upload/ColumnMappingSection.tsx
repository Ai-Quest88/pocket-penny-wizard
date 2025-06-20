
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ColumnMappingSectionProps {
  headers: string[]
  mappings: Record<string, string>
  onMappingChange: (field: string, column: string) => void
}

export const ColumnMappingSection: React.FC<ColumnMappingSectionProps> = ({
  headers,
  mappings,
  onMappingChange
}) => {
  const validHeaders = headers.filter(header => {
    return header && 
           typeof header === 'string' && 
           header.trim() !== '' && 
           header.trim() !== 'undefined' && 
           header.trim() !== 'null' &&
           header.length > 0
  })

  const requiredFields = [
    { key: 'date', label: 'Date *' },
    { key: 'amount', label: 'Amount *' },
    { key: 'description', label: 'Description *' },
    { key: 'currency', label: 'Currency' },
    { key: 'category', label: 'Category' }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Map File Columns</h3>
      <p className="text-sm text-muted-foreground">
        Map your file columns to transaction fields. Required fields are marked with *
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {requiredFields.map(field => (
          <div key={field.key}>
            <Label htmlFor={`${field.key}-mapping`}>{field.label}</Label>
            <Select value={mappings[field.key] || ''} onValueChange={(value) => onMappingChange(field.key, value)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.key} column`} />
              </SelectTrigger>
              <SelectContent>
                {validHeaders.map(header => (
                  <SelectItem key={`${field.key}-${header}`} value={header}>{header}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
