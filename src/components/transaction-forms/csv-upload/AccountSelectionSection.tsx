
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountSelectionSectionProps {
  selectedAccountId: string | null;
  onAccountChange: (accountId: string | null) => void;
}

export const AccountSelectionSection = ({ 
  selectedAccountId, 
  onAccountChange 
}: AccountSelectionSectionProps) => {
  const { accounts, isLoading } = useAccounts();

  console.log("AccountSelectionSection - accounts:", accounts, "isLoading:", isLoading, "selectedAccountId:", selectedAccountId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Account Selection</Label>
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  const handleValueChange = (value: string) => {
    console.log("Account selection changed:", value);
    if (value === "no-account") {
      onAccountChange(null);
    } else {
      onAccountChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="account-select">Link transactions to account</Label>
      <Select value={selectedAccountId || "no-account"} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an account for these transactions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-account">No account (manual assignment later)</SelectItem>
          {accounts && accounts.length > 0 ? (
            accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} ({account.type}) - {account.entityName}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="no-accounts-available" disabled>
              No accounts available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {selectedAccountId && (
        <p className="text-sm text-muted-foreground">
          All transactions will be linked to the selected account
        </p>
      )}
      {accounts && accounts.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">
          No accounts found. Create accounts in Assets or Liabilities sections first.
        </p>
      )}
    </div>
  );
};
