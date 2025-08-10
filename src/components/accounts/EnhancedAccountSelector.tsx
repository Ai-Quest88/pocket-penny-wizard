import { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { useAccounts } from "@/hooks/useAccounts"
import { AccountTypeIndicator } from "./AccountTypeIndicator"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AccountManager } from "@/components/AccountManager"

interface EnhancedAccountSelectorProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  placeholder?: string
  filterTransactional?: boolean
}

export function EnhancedAccountSelector<T extends FieldValues>({ 
  control, 
  name, 
  label = "Account",
  placeholder = "Select an account",
  filterTransactional = false 
}: EnhancedAccountSelectorProps<T>) {
  const { accounts, isLoading } = useAccounts()
  const { formatCurrency } = useCurrency()
  const [showAddAccount, setShowAddAccount] = useState(false)

  const filteredAccounts = filterTransactional 
    ? accounts.filter(account => ['savings_account', 'checking_account'].includes(account.type.toLowerCase().replace(' ', '_')))
    : accounts

  const groupedAccounts = {
    assets: filteredAccounts.filter(account => account.accountType === 'asset'),
    liabilities: filteredAccounts.filter(account => account.accountType === 'liability')
  }

  return (
    <>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>{label}</FormLabel>
              <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                  </DialogHeader>
                  <AccountManager onAccountAdded={() => setShowAddAccount(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Loading accounts..." : placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="max-h-80 bg-background border shadow-lg z-[100]">
                {/* Assets Group */}
                {groupedAccounts.assets.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-green-600 uppercase tracking-wide bg-green-50 dark:bg-green-900/20 border-b">
                      Assets
                    </div>
                    {groupedAccounts.assets.map((account) => (
                      <SelectItem 
                        key={account.id} 
                        value={account.id}
                        className="pl-6 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Building2 className="h-3 w-3 text-green-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{account.entityName}</span>
                              {account.accountNumber && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(account.currentBalance)}
                          </div>
                          <div className="text-xs text-muted-foreground">{account.type}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}

                {/* Liabilities Group */}
                {groupedAccounts.liabilities.length > 0 && (
                  <>
                    {groupedAccounts.assets.length > 0 && (
                      <div className="h-px bg-border my-1" />
                    )}
                    <div className="px-3 py-2 text-xs font-semibold text-red-600 uppercase tracking-wide bg-red-50 dark:bg-red-900/20 border-b">
                      Liabilities
                    </div>
                    {groupedAccounts.liabilities.map((account) => (
                      <SelectItem 
                        key={account.id} 
                        value={account.id}
                        className="pl-6 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Building2 className="h-3 w-3 text-red-600" />
                          <div className="flex flex-col">
                            <span className="font-medium">{account.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{account.entityName}</span>
                              {account.accountNumber && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-red-600">
                            {formatCurrency(Math.abs(account.currentBalance))}
                          </div>
                          <div className="text-xs text-muted-foreground">{account.type}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}

                {filteredAccounts.length === 0 && !isLoading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No accounts found. Click "Add Account" to create one.
                  </div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}