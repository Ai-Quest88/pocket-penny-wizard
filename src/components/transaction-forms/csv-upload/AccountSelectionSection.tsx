
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Account Selection</Label>
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="account-select">Link transactions to account</Label>
      <Select value={selectedAccountId || ""} onValueChange={(value) => onAccountChange(value || null)}>
        <SelectTrigger>
          <SelectValue placeholder="Select an account for these transactions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No account (manual assignment later)</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {account.name} ({account.type}) - {account.entityName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedAccountId && (
        <p className="text-sm text-muted-foreground">
          All transactions will be linked to the selected account
        </p>
      )}
    </div>
  );
};
