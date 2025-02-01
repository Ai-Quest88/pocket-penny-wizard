import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: "savings" | "checking" | "credit" | "investment";
  balance: number;
}

export const AccountManager = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "1", name: "Main Savings", type: "savings", balance: 12500.00 },
    { id: "2", name: "Everyday Spending", type: "checking", balance: 3250.50 },
    { id: "3", name: "Credit Card", type: "credit", balance: -1200.30 },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState<{
    name: string;
    type: Account["type"];
    balance: number;
  }>({
    name: "",
    type: "checking",
    balance: 0,
  });

  const handleAddAccount = () => {
    if (newAccount.name) {
      setAccounts([
        ...accounts,
        {
          id: Date.now().toString(),
          ...newAccount,
        },
      ]);
      setNewAccount({ name: "", type: "checking", balance: 0 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Linked Accounts</h2>
        <Button
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <Input
              id="account-name"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              placeholder="e.g., Main Savings"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">Account Type</Label>
            <Select
              value={newAccount.type}
              onValueChange={(value: Account["type"]) =>
                setNewAccount({ ...newAccount, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial-balance">Initial Balance</Label>
            <Input
              id="initial-balance"
              type="number"
              value={newAccount.balance}
              onChange={(e) =>
                setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
            />
          </div>

          <Button onClick={handleAddAccount} className="w-full">
            Add Account
          </Button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{account.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{account.type}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-2xl font-semibold">
                ${Math.abs(account.balance).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {account.balance < 0 && (
                <span className="text-sm text-red-500 font-medium">Owed</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};