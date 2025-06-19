
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns"
import { Download } from "lucide-react"

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  netFlow: number;
  endingBalance: number;
}

export function CashFlowReport() {
  const { session } = useAuth();

  const { data: cashFlowData, isLoading } = useQuery({
    queryKey: ['cash-flow-report', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const months: MonthlyData[] = [];
      let runningBalance = 0;

      // Get starting balance from assets
      const { data: assets } = await supabase
        .from('assets')
        .select('value, type')
        .eq('user_id', session.user.id)
        .eq('type', 'cash');

      const startingBalance = assets?.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
      runningBalance = startingBalance;

      // Generate 12 months of data (6 past, current, 5 future)
      for (let i = -6; i <= 5; i++) {
        const monthDate = addMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        let income = 0;
        let expenses = 0;

        if (i <= 0) {
          // Past and current months - use actual transaction data
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', session.user.id)
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          if (transactions) {
            transactions.forEach(transaction => {
              const amount = Number(transaction.amount);
              if (amount > 0) {
                income += amount;
              } else {
                expenses += Math.abs(amount);
              }
            });
          }
        } else {
          // Future months - use budget projections
          const { data: budgets } = await supabase
            .from('budgets')
            .select('amount, category')
            .eq('user_id', session.user.id)
            .eq('is_active', true);

          if (budgets) {
            // Simple projection based on budget data
            const monthlyBudgetIncome = budgets.filter(b => Number(b.amount) > 0).reduce((sum, b) => sum + Number(b.amount), 0);
            const monthlyBudgetExpenses = budgets.filter(b => Number(b.amount) < 0).reduce((sum, b) => sum + Math.abs(Number(b.amount)), 0);
            
            income = monthlyBudgetIncome;
            expenses = monthlyBudgetExpenses;
          }
        }

        const netFlow = income - expenses;
        runningBalance += netFlow;

        months.push({
          month: format(monthDate, 'MMM yyyy'),
          income,
          expenses,
          netFlow,
          endingBalance: runningBalance
        });
      }

      return {
        months,
        startingBalance
      };
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
        </div>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading cash flow data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cashFlowData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No cash flow data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Starting Balance</p>
            <p className="text-xl font-semibold">${cashFlowData.startingBalance.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-xl font-semibold text-green-600">
              ${cashFlowData.months.reduce((sum, month) => sum + month.income, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-semibold text-red-600">
              ${cashFlowData.months.reduce((sum, month) => sum + month.expenses, 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Cash Flow</p>
            <p className="text-xl font-semibold">
              ${cashFlowData.months.reduce((sum, month) => sum + month.netFlow, 0).toFixed(2)}
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
                  <td className="text-right py-2 text-green-600">${month.income.toFixed(2)}</td>
                  <td className="text-right py-2 text-red-600">${month.expenses.toFixed(2)}</td>
                  <td className={`text-right py-2 ${month.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${month.netFlow.toFixed(2)}
                  </td>
                  <td className="text-right py-2 font-medium">${month.endingBalance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
