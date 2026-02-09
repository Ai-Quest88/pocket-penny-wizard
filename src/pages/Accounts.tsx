import { AccountManager } from "@/components/AccountManager"
import { useAccountBalances } from "@/hooks/useAccountBalances"
import { useCurrency } from "@/contexts/CurrencyContext"

const Accounts = () => {
  const { data: balances = [], isLoading } = useAccountBalances()
  const { formatCurrency } = useCurrency()
  const totalBalance = balances.reduce((sum, b) => sum + b.calculatedBalance, 0)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </header>

        {!isLoading && balances.length > 0 && (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total balance across accounts</p>
            <p className="text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
          </div>
        )}

        <AccountManager />
      </div>
    </div>
  )
}

export default Accounts