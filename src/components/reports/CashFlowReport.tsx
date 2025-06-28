import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { useState } from "react"
import { CurrencySelector } from "@/components/transactions/CurrencySelector"
import { fetchExchangeRates, convertAmount, formatCurrency } from "@/utils/currencyUtils"

interface MonthlyData {
  month: string
  income: number
  expenses: number
  netFlow: number
  endingBalance: number
}

interface CashFlowData {
  startingBalance: number
  months: MonthlyData[]
}

export function CashFlowReport() {
  const { session } = useAuth()
  const [displayCurrency, setDisplayCurrency] = useState("AUD")

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })

  const { data: cashFlowData, isLoading } = useQuery<CashFlowData>({
    queryKey: ['cash-flow-report', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) throw new Error('No authenticated user')

      const endDate = new Date()
      const startDate = subMonths(endDate, 6) // Last 6 months

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

      if (error) throw error

      // Group transactions by month with currency conversion
      const monthlyData: Record<string, { income: number; expenses: number }> = {}
      let runningBalance = 0

      // Calculate starting balance (transactions before the period)
      const { data: earlierTransactions } = await supabase
        .from('transactions')
        .select('amount, currency')
        .eq('user_id', session.user.id)
        .lt('date', format(startDate, 'yyyy-MM-dd'))

      const startingBalance = (earlierTransactions || []).reduce((sum, transaction) => {
        const convertedAmount = exchangeRates 
          ? convertAmount(transaction.amount, transaction.currency, displayCurrency, exchangeRates)
          : transaction.amount
        return sum + convertedAmount
      }, 0)

      runningBalance = startingBalance

      // Process transactions for the period
      transactions?.forEach(transaction => {
        const monthKey = format(new Date(transaction.date), 'MMM yyyy')
        const convertedAmount = exchangeRates 
          ? convertAmount(transaction.amount, transaction.currency, displayCurrency, exchangeRates)
          : transaction.amount

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0 }
        }

        if (convertedAmount > 0) {
          monthlyData[monthKey].income += convertedAmount
        } else {
          monthlyData[monthKey].expenses += Math.abs(convertedAmount)
        }
      })

      // Generate monthly summary
      const months: MonthlyData[] = []
      for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(endDate, 5 - i)
        const monthKey = format(monthDate, 'MMM yyyy')
        const monthData = monthlyData[monthKey] || { income: 0, expenses: 0 }
        
        const netFlow = monthData.income - monthData.expenses
        runningBalance += netFlow

        months.push({
          month: monthKey,
          income: monthData.income,
          expenses: monthData.expenses,
          netFlow,
          endingBalance: runningBalance
        })
      }

      return {
        startingBalance,
        months
      }
    },
    enabled: !!session?.user && !!exchangeRates,
  })

  if (isLoading || ratesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
          <div className="flex items-center gap-4">
            <CurrencySelector
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              variant="compact"
            />
          </div>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cashFlowData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
          <div className="flex items-center gap-4">
            <CurrencySelector
              displayCurrency={displayCurrency}
              onCurrencyChange={setDisplayCurrency}
              variant="compact"
            />
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
        <div className="flex items-center gap-4">
          <CurrencySelector
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
            variant="compact"
          />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Starting Balance</p>
            <p className="text-xl font-semibold">{formatCurrency(cashFlowData.startingBalance, displayCurrency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(cashFlowData.months.reduce((sum, month) => sum + month.income, 0), displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-semibold text-red-600">
              {formatCurrency(cashFlowData.months.reduce((sum, month) => sum + month.expenses, 0), displayCurrency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Cash Flow</p>
            <p className="text-xl font-semibold">
              {formatCurrency(cashFlowData.months.reduce((sum, month) => sum + month.netFlow, 0), displayCurrency)}
            </p>
          </div>
        </div>
      </Card>

      {/* Monthly Cash Flow Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Month</th>
                <th className="text-right py-2">Income</th>
                <th className="text-right py-2">Expenses</th>
                <th className="text-right py-2">Net Flow</th>
                <th className="text-right py-2">Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {cashFlowData.months.map((month, index) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="py-2 font-medium">{month.month}</td>
                  <td className="text-right py-2 text-green-600">{formatCurrency(month.income, displayCurrency)}</td>
                  <td className="text-right py-2 text-red-600">{formatCurrency(month.expenses, displayCurrency)}</td>
                  <td className={`text-right py-2 ${month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(month.netFlow, displayCurrency)}
                  </td>
                  <td className="text-right py-2 font-medium">{formatCurrency(month.endingBalance, displayCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
