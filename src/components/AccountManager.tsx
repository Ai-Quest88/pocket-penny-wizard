import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

interface AccountManagerProps {
  onAccountAdded?: () => void;
}

export const AccountManager = ({ onAccountAdded }: AccountManagerProps) => {
  const { accounts, isLoading } = useAccounts();
  const { session } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch entities for the dropdown
  const { data: entities = [] } = useQuery({
    queryKey: ['entities', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('entities')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('name');
      
      if (error) {
        console.error('Error fetching entities:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  const [newAccount, setNewAccount] = useState({
    entityId: "",
    bankName: "",
    accountNumber: "",
    nickName: "",
    accountType: "savings_account",
    currency: "AUD",
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0],
  });

  const accountTypes = [
    { value: "savings_account", label: "Savings Account" },
    { value: "current_account", label: "Current Account" },
    { value: "credit_card", label: "Credit Card" },
    { value: "term_deposit", label: "Term Deposit" },
    { value: "investment_account", label: "Investment Account" },
  ];

  const currencies = [
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
  ];

  const handleAddAccount = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to add an account",
        variant: "destructive",
      });
      return;
    }

    if (!newAccount.entityId || !newAccount.nickName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      console.log('Adding new account:', newAccount);

      // Determine if this should be an asset or liability based on account type
      const isLiability = newAccount.accountType === "credit_card";

      if (isLiability) {
        // Create as liability
        const { error } = await supabase
          .from('liabilities')
          .insert({
            user_id: session.user.id,
            entity_id: newAccount.entityId,
            name: newAccount.nickName,
            type: 'debt',
            category: newAccount.accountType,
            account_number: newAccount.accountNumber,
            amount: Math.abs(newAccount.openingBalance), // Liabilities are positive amounts
          });

        if (error) throw error;
      } else {
        // Create as asset (cash account)
        const { error } = await supabase
          .from('assets')
          .insert({
            user_id: session.user.id,
            entity_id: newAccount.entityId,
            name: newAccount.nickName,
            type: 'cash',
            category: newAccount.accountType,
            account_number: newAccount.accountNumber,
            value: newAccount.openingBalance,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Account added successfully",
      });

      // Reset form
      setNewAccount({
        entityId: "",
        bankName: "",
        accountNumber: "",
        nickName: "",
        accountType: "savings_account",
        currency: "AUD",
        openingBalance: 0,
        openingBalanceDate: new Date().toISOString().split('T')[0],
      });
      
      setShowAddForm(false);
      onAccountAdded?.();

    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Error",
        description: "Failed to add account",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Bank Accounts</h2>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bank Account Set Up</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">Entity Name *</Label>
                <Select
                  value={newAccount.entityId}
                  onValueChange={(value) => setNewAccount({ ...newAccount, entityId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  value={newAccount.bankName}
                  onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  placeholder="Bank Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-no">Account No</Label>
                <Input
                  id="account-no"
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="Account No"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nick-name">Nick Name *</Label>
                <Input
                  id="nick-name"
                  value={newAccount.nickName}
                  onChange={(e) => setNewAccount({ ...newAccount, nickName: e.target.value })}
                  placeholder="e.g., CBA1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-type">Type of Account</Label>
                <Select
                  value={newAccount.accountType}
                  onValueChange={(value) => setNewAccount({ ...newAccount, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={newAccount.currency}
                  onValueChange={(value) => setNewAccount({ ...newAccount, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance">
                  {newAccount.accountType === "credit_card" ? "Credit Limit" : "Opening Balance"}
                </Label>
                <Input
                  id="opening-balance"
                  type="number"
                  step="0.01"
                  value={newAccount.openingBalance}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, openingBalance: parseFloat(e.target.value) || 0 })
                  }
                  placeholder={newAccount.accountType === "credit_card" ? "Credit Limit" : "Opening Balance"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">
                  {newAccount.accountType === "credit_card" ? "Account Opening Date" : "Opening Balance Date"}
                </Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  value={newAccount.openingBalanceDate}
                  onChange={(e) => setNewAccount({ ...newAccount, openingBalanceDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Close
                </Button>
                <Button onClick={handleAddAccount} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading accounts...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{account.name}</h3>
                  <p className="text-sm text-muted-foreground">{account.type}</p>
                  <p className="text-xs text-muted-foreground">{account.entityName}</p>
                  {account.accountNumber && (
                    <p className="text-xs text-muted-foreground">A/C: {account.accountNumber}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-semibold">
                  ${Math.abs(account.currentBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {account.accountType === 'liability' && (
                  <span className="text-sm text-red-500 font-medium">Owed</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
