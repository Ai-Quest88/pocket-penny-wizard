
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface DefaultSettingsSectionProps {
  defaultSettings: {
    description: string;
    currency: string;
    category: string;
  };
  onSettingsChange: (field: string, value: string) => void;
}

export const DefaultSettingsSection: React.FC<DefaultSettingsSectionProps> = ({
  defaultSettings,
  onSettingsChange
}) => {
  const currencies = [
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
  ]

  const categories = [
    'Food & Dining',
    'Shopping',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Income',
    'Transfer',
    'Other'
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Default Settings</h3>
      <p className="text-sm text-muted-foreground">
        Set default values for transactions that don't have these fields in your file
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="default-description">Default Description</Label>
          <Input
            id="default-description"
            value={defaultSettings.description}
            onChange={(e) => onSettingsChange('description', e.target.value)}
            placeholder="Enter default description"
          />
        </div>

        <div>
          <Label htmlFor="default-currency">Default Currency</Label>
          <Select value={defaultSettings.currency} onValueChange={(value) => onSettingsChange('currency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-category">Default Category</Label>
          <Select value={defaultSettings.category} onValueChange={(value) => onSettingsChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
