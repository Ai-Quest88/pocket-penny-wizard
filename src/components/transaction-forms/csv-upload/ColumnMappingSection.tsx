
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ColumnMappingSectionProps {
  headers: string[]
  mapping: Record<string, string>
  onMappingChange: (field: string, column: string) => void
}

export const ColumnMappingSection: React.FC<ColumnMappingSectionProps> = ({
  headers,
  mapping,
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Map File Columns</h3>
      <p className="text-sm text-muted-foreground">
        Map your file columns to transaction fields. Required fields are marked with *
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date-mapping">Date *</Label>
          <Select value={mapping.date || ''} onValueChange={(value) => onMappingChange('date', value)}>
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
          <Select value={mapping.amount || ''} onValueChange={(value) => onMappingChange('amount', value)}>
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
          <Select value={mapping.description || ''} onValueChange={(value) => onMappingChange('description', value)}>
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
          <Select value={mapping.category || ''} onValueChange={(value) => onMappingChange('category', value)}>
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
          <Select value={mapping.account || ''} onValueChange={(value) => onMappingChange('account', value)}>
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
      </div>
    </div>
  )
}
