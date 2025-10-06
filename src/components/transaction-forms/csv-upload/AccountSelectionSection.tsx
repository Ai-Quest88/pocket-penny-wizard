import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAccounts } from "@/hooks/useAccounts";
import { AccountTypeIndicator } from "@/components/accounts/AccountTypeIndicator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Building2 } from "lucide-react";
interface AccountSelectionSectionProps {
  selectedAccountId: string | null;
  onAccountChange: (accountId: string | null) => void;
}
export const AccountSelectionSection = ({
  selectedAccountId,
  onAccountChange
}: AccountSelectionSectionProps) => {
  const {
    accounts,
    isLoading
  } = useAccounts();
  const {
    formatCurrency
  } = useCurrency();
  if (isLoading) {
    return <div className="space-y-2">
        <Label>Account Selection</Label>
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>;
  }
  const handleValueChange = (value: string) => {
    if (value === "no-account") {
      onAccountChange(null);
    } else {
      onAccountChange(value);
    }
  };

  // Group accounts by type for better organization
  const groupedAccounts = {
    assets: accounts.filter(account => account.accountType === 'asset'),
    liabilities: accounts.filter(account => account.accountType === 'liability')
  };
  return <div className="space-y-4">
      <div>
        <Label htmlFor="account-select" className="text-base font-medium">Link transactions to account</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which account these transactions belong to. Only transactional accounts (savings/checking) are recommended.
        </p>
      </div>
      
      <Select value={selectedAccountId || "no-account"} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full h-auto min-h-[40px]">
          {selectedAccountId ? <div className="flex items-center justify-between w-full gap-2 py-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">
                    {accounts.find(acc => acc.id === selectedAccountId)?.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {accounts.find(acc => acc.id === selectedAccountId)?.entityName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <AccountTypeIndicator type={accounts.find(acc => acc.id === selectedAccountId)?.type || ''} category={accounts.find(acc => acc.id === selectedAccountId)?.type?.toLowerCase().replace(' ', '_') || ''} accountType={accounts.find(acc => acc.id === selectedAccountId)?.accountType || 'asset'} className="text-xs" />
                <span className="text-sm font-medium">
                  {formatCurrency(accounts.find(acc => acc.id === selectedAccountId)?.currentBalance || 0)}
                </span>
              </div>
            </div> : <SelectValue placeholder="Select an account for these transactions" />}
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)] bg-background border shadow-lg z-[100]">
          <SelectItem value="no-account" className="border-b mb-2">
            <div className="flex flex-col py-2">
              <span className="font-medium">No Account</span>
              <span className="text-xs text-muted-foreground">Assign transactions manually later</span>
            </div>
          </SelectItem>
          
          {/* Assets Group */}
          {groupedAccounts.assets.length > 0 && <>
              <div className="px-3 py-2 text-xs font-semibold text-green-600 uppercase tracking-wide bg-green-50 dark:bg-green-900/20 border-b">
                Asset Accounts
              </div>
              {groupedAccounts.assets.map(account => <SelectItem key={account.id} value={account.id} className="pl-6 py-3">
                  <div className="flex items-start gap-3 w-full min-w-0">
                    <Building2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate flex-1">{account.name}</span>
                        <AccountTypeIndicator type={account.type} category={account.type.toLowerCase().replace(' ', '_')} accountType="asset" className="flex-shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                        <span className="truncate flex-1">{account.entityName}</span>
                        <span className="text-green-600 font-medium whitespace-nowrap">
                          {formatCurrency(account.currentBalance)}
                        </span>
                      </div>
                      {account.accountNumber && <div className="text-xs text-muted-foreground truncate">
                          A/C: {account.accountNumber}
                        </div>}
                    </div>
                  </div>
                </SelectItem>)}
            </>}

          {/* Liabilities Group */}
          {groupedAccounts.liabilities.length > 0 && <>
              {groupedAccounts.assets.length > 0 && <div className="h-px bg-border my-2" />}
              <div className="px-3 py-2 text-xs font-semibold text-red-600 uppercase tracking-wide bg-red-50 dark:bg-red-900/20 border-b">
                Liability Accounts
              </div>
              {groupedAccounts.liabilities.map(account => <SelectItem key={account.id} value={account.id} className="pl-6 py-3">
                  <div className="flex items-start gap-3 w-full min-w-0">
                    <Building2 className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate flex-1">{account.name}</span>
                        <AccountTypeIndicator type={account.type} category={account.type.toLowerCase().replace(' ', '_')} accountType="liability" className="flex-shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                        <span className="truncate flex-1">{account.entityName}</span>
                        <span className="text-red-600 font-medium whitespace-nowrap">
                          {formatCurrency(Math.abs(account.currentBalance))}
                        </span>
                      </div>
                      {account.accountNumber && <div className="text-xs text-muted-foreground truncate">
                          A/C: {account.accountNumber}
                        </div>}
                    </div>
                  </div>
                </SelectItem>)}
            </>}

          {accounts.length === 0 && <SelectItem value="no-accounts-available" disabled>
              <div className="text-center py-4">
                <span className="text-muted-foreground">No accounts available</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Create accounts in Assets or Liabilities sections first
                </p>
              </div>
            </SelectItem>}
        </SelectContent>
      </Select>
    </div>;
};