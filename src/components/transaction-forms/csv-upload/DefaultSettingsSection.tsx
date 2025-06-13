
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccounts } from "@/hooks/useAccounts"

interface DefaultSettingsSectionProps {
  defaultCurrency: string
  setDefaultCurrency: (currency: string) => void
  defaultAccount: string
  setDefaultAccount: (account: string) => void
}

export const DefaultSettingsSection: React.FC<DefaultSettingsSectionProps> = ({
  defaultCurrency,
  setDefaultCurrency,
  defaultAccount,
  setDefaultAccount
}) => {
  const { accounts, isLoading: accountsLoading } = useAccounts()

  const validAccounts = accounts.filter(account => {
    return account && 
           account.name && 
           typeof account.name === 'string' && 
           account.name.trim() !== '' &&
           account.name.trim() !== 'undefined' &&
           account.name.trim() !== 'null' &&
           account.id &&
           typeof account.id === 'string' &&
           account.id.trim() !== ''
  })

  return (
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
            {validAccounts.length === 0 && !accountsLoading ? (
              <SelectItem value="no-accounts" disabled>
                No accounts found. Create accounts in Assets first.
              </SelectItem>
            ) : (
              validAccounts.map(account => (
                <SelectItem key={account.id} value={`${account.name} (${account.entityName})`}>
                  {account.name} - {account.entityName} ({account.type})
                  {account.accountNumber && ` - ${account.accountNumber}`}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {validAccounts.length === 0 && !accountsLoading && (
          <p className="text-sm text-muted-foreground mt-1">
            Create cash accounts under entities in Assets first.
          </p>
        )}
      </div>
    </div>
  )
}
