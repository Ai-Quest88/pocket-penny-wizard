
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
  const { accounts, isLoading } = useAccounts();
  const { formatCurrency } = useCurrency();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Account Selection</Label>
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
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

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="account-select" className="text-base font-medium">Link transactions to account</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which account these transactions belong to. Only transactional accounts (savings/checking) are recommended.
        </p>
      </div>
      
      <Select value={selectedAccountId || "no-account"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an account for these transactions" />
        </SelectTrigger>
        <SelectContent className="max-h-80 bg-background border shadow-lg z-[100]">
          <SelectItem value="no-account" className="border-b mb-2">
            <div className="flex flex-col py-2">
              <span className="font-medium">No Account</span>
              <span className="text-xs text-muted-foreground">Assign transactions manually later</span>
            </div>
          </SelectItem>
          
          {/* Assets Group */}
          {groupedAccounts.assets.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-green-600 uppercase tracking-wide bg-green-50 dark:bg-green-900/20 border-b">
                Asset Accounts
              </div>
              {groupedAccounts.assets.map((account) => (
                <SelectItem 
                  key={account.id} 
                  value={account.id}
                  className="pl-6 py-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Building2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{account.name}</span>
                        <AccountTypeIndicator 
                          type={account.type} 
                          category={account.type.toLowerCase().replace(' ', '_')}
                          accountType="asset"
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{account.entityName}</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(account.currentBalance)}
                        </span>
                      </div>
                      {account.accountNumber && (
                        <div className="text-xs text-muted-foreground">
                          A/C: {account.accountNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Liabilities Group */}
          {groupedAccounts.liabilities.length > 0 && (
            <>
              {groupedAccounts.assets.length > 0 && (
                <div className="h-px bg-border my-2" />
              )}
              <div className="px-3 py-2 text-xs font-semibold text-red-600 uppercase tracking-wide bg-red-50 dark:bg-red-900/20 border-b">
                Liability Accounts
              </div>
              {groupedAccounts.liabilities.map((account) => (
                <SelectItem 
                  key={account.id} 
                  value={account.id}
                  className="pl-6 py-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <Building2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{account.name}</span>
                        <AccountTypeIndicator 
                          type={account.type} 
                          category={account.type.toLowerCase().replace(' ', '_')}
                          accountType="liability"
                          className="flex-shrink-0"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{account.entityName}</span>
                        <span className="text-red-600 font-medium">
                          {formatCurrency(Math.abs(account.currentBalance))}
                        </span>
                      </div>
                      {account.accountNumber && (
                        <div className="text-xs text-muted-foreground">
                          A/C: {account.accountNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {accounts.length === 0 && (
            <SelectItem value="no-accounts-available" disabled>
              <div className="text-center py-4">
                <span className="text-muted-foreground">No accounts available</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Create accounts in Assets or Liabilities sections first
                </p>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {selectedAccountId && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✓ All imported transactions will be automatically linked to the selected account
          </p>
        </div>
      )}
    </div>
  );
};
