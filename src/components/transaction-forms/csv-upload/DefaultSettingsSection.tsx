
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccounts } from "@/hooks/useAccounts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface DefaultSettingsSectionProps {
  defaultCurrency: string
  setDefaultCurrency: (currency: string) => void
  defaultAccount: string
  setDefaultAccount: (account: string) => void
  showAccountError?: boolean
}

export const DefaultSettingsSection: React.FC<DefaultSettingsSectionProps> = ({
  defaultCurrency,
  setDefaultCurrency,
  defaultAccount,
  setDefaultAccount,
  showAccountError = false
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

  const hasNoAccounts = validAccounts.length === 0 && !accountsLoading
  const isAccountNotSelected = !defaultAccount || defaultAccount === 'Default Account' || defaultAccount.trim() === ''

  // Separate accounts by type
  const assetAccounts = validAccounts.filter(acc => acc.accountType === 'asset')
  const liabilityAccounts = validAccounts.filter(acc => acc.accountType === 'liability')

  return (
    <div className="space-y-4">
      {hasNoAccounts && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No accounts found!</strong> You must create cash accounts in Assets or debt accounts in Liabilities before uploading transactions. Without an account selection, transactions cannot be properly imported.
          </AlertDescription>
        </Alert>
      )}

      {showAccountError && isAccountNotSelected && !hasNoAccounts && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Account selection required!</strong> Please select an account before uploading transactions. This ensures your transactions are properly categorized and balances are updated correctly.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="default-currency">Default Currency</Label>
          <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUD">AUD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-account">Default Account *</Label>
          <Select 
            value={defaultAccount} 
            onValueChange={setDefaultAccount} 
            disabled={accountsLoading || hasNoAccounts}
          >
            <SelectTrigger className={hasNoAccounts || (showAccountError && isAccountNotSelected) ? "border-red-500 ring-red-500" : ""}>
              <SelectValue placeholder={hasNoAccounts ? "No accounts available" : "Select default account"} />
            </SelectTrigger>
            <SelectContent>
              {hasNoAccounts ? (
                <SelectItem value="no-accounts" disabled>
                  No accounts found. Create accounts in Assets/Liabilities first.
                </SelectItem>
              ) : (
                <>
                  {assetAccounts.length > 0 && (
                    <>
                      <SelectItem value="assets-header" disabled className="font-semibold">
                        --- Assets ---
                      </SelectItem>
                      {assetAccounts.map(account => (
                        <SelectItem key={account.id} value={`${account.name} - ${account.entityName} (${account.accountType})`}>
                          {account.name} - {account.entityName} ({account.type})
                          {account.accountNumber && ` - ${account.accountNumber}`}
                          <span className="ml-2 text-sm text-muted-foreground">
                            Balance: ${account.currentBalance.toLocaleString()}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {liabilityAccounts.length > 0 && (
                    <>
                      <SelectItem value="liabilities-header" disabled className="font-semibold">
                        --- Liabilities ---
                      </SelectItem>
                      {liabilityAccounts.map(account => (
                        <SelectItem key={account.id} value={`${account.name} - ${account.entityName} (${account.accountType})`}>
                          {account.name} - {account.entityName} ({account.type})
                          {account.accountNumber && ` - ${account.accountNumber}`}
                          <span className="ml-2 text-sm text-muted-foreground">
                            Balance: ${account.currentBalance.toLocaleString()}
                          </span>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
          {hasNoAccounts ? (
            <p className="text-sm text-red-600 mt-1">
              <strong>Required:</strong> Create cash accounts under entities in Assets or debt accounts in Liabilities first.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Required:</strong> This account will be used for transactions that don't specify an account in the CSV.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
