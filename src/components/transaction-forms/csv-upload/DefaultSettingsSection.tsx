
import React from 'react'
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { currencies } from "@/types/transaction-forms"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

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
  const { session } = useAuth()

  // Fetch both assets and liabilities for account selection
  const { data: allAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['all-accounts-csv', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      // Fetch cash assets
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .eq('type', 'cash')
        .in('category', ['savings_account', 'checking_account', 'term_deposit'])
        .order('name');

      if (assetsError) {
        console.error('Error fetching assets:', assetsError);
        throw assetsError;
      }

      // Fetch liabilities
      const { data: liabilities, error: liabilitiesError } = await supabase
        .from('liabilities')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .order('name');

      if (liabilitiesError) {
        console.error('Error fetching liabilities:', liabilitiesError);
        throw liabilitiesError;
      }

      // Combine assets and liabilities
      const combinedAccounts = [
        ...assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          accountNumber: asset.account_number,
          entityName: asset.entities.name,
          accountType: 'asset' as const,
          displayType: 'Asset'
        })),
        ...liabilities.map(liability => ({
          id: liability.id,
          name: liability.name,
          type: liability.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          accountNumber: liability.account_number,
          entityName: liability.entities.name,
          accountType: 'liability' as const,
          displayType: 'Liability'
        }))
      ];

      return combinedAccounts;
    },
    enabled: !!session?.user,
  });

  const validCurrencies = currencies.filter(curr => 
    curr && 
    curr.code && 
    typeof curr.code === 'string' && 
    curr.code.trim() !== "" &&
    curr.name &&
    typeof curr.name === 'string' &&
    curr.name.trim() !== ""
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Default Settings</h3>
      <p className="text-sm text-muted-foreground">
        Set default values for transactions that don't have these fields in your file
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="default-currency">Default Currency</Label>
          <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {validCurrencies.map((curr) => {
                if (!curr.code || curr.code.trim() === "") {
                  return null;
                }
                return (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-account">Default Account *</Label>
          <Select value={defaultAccount} onValueChange={setDefaultAccount} disabled={accountsLoading}>
            <SelectTrigger className={showAccountError ? "border-red-500" : ""}>
              <SelectValue placeholder="Select default account" />
            </SelectTrigger>
            <SelectContent>
              {allAccounts.length === 0 && !accountsLoading ? (
                <SelectItem value="no-accounts" disabled>
                  No accounts found. Create accounts first.
                </SelectItem>
              ) : (
                allAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} - {acc.entityName} ({acc.type}) [{acc.displayType}]
                    {acc.accountNumber && ` - ${acc.accountNumber}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {showAccountError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select an account before uploading transactions.
              </AlertDescription>
            </Alert>
          )}
          {allAccounts.length === 0 && !accountsLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              You need to create accounts under Assets or Liabilities first.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
