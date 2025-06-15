
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface CashFlowChartProps {
  entityId?: string;
}

interface CashFlowData {
  period: string;
  moneyIn: number;
  moneyOut: number;
  leftover: number;
}

export const CashFlowChart = ({ entityId }: CashFlowChartProps) => {
  const [timeFrame, setTimeFrame] = useState<string>("monthly")
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { session } = useAuth()

  useEffect(() => {
    const fetchCashFlowData = async () => {
      if (!session?.user) return

      setIsLoading(true)
      try {
        // Calculate date range based on timeframe
        const now = new Date()
        let startDate = new Date()
        let periods: string[] = []

        switch (timeFrame) {
          case "quarterly":
            startDate.setFullYear(now.getFullYear() - 1)
            periods = generateQuarterlyPeriods(startDate, now)
            break
          case "yearly":
            startDate.setFullYear(now.getFullYear() - 2)
            periods = generateYearlyPeriods(startDate, now)
            break
          default: // monthly
            startDate.setMonth(now.getMonth() - 11)
            periods = generateMonthlyPeriods(startDate, now)
        }

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true })

        if (error) {
          console.error('Error fetching transactions for cash flow:', error)
          return
        }

        // Group transactions by period
        const periodData: Record<string, { income: number; expense: number }> = {}
        
        // Initialize all periods with zero values
        periods.forEach(period => {
          periodData[period] = { income: 0, expense: 0 }
        })

        transactions?.forEach(transaction => {
          const transactionDate = new Date(transaction.date)
          let period: string

          switch (timeFrame) {
            case "quarterly":
              period = getQuarterPeriod(transactionDate)
              break
            case "yearly":
              period = transactionDate.getFullYear().toString()
              break
            default: // monthly
              period = transactionDate.toLocaleDateString('en-US', { 
                month: 'short', 
                year: '2-digit' 
              })
          }

          if (periodData[period]) {
            if (transaction.amount > 0) {
              periodData[period].income += Math.abs(transaction.amount)
            } else {
              periodData[period].expense += Math.abs(transaction.amount)
            }
          }
        })

        // Convert to chart data format
        const chartData: CashFlowData[] = periods.map(period => {
          const data = periodData[period]
          return {
            period,
            moneyIn: data.income,
            moneyOut: data.expense,
            leftover: data.income - data.expense
          }
        })

        setCashFlowData(chartData)
      } catch (error) {
        console.error('Error processing cash flow data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCashFlowData()
  }, [timeFrame, session?.user, entityId])

  const generateMonthlyPeriods = (startDate: Date, endDate: Date): string[] => {
    const periods: string[] = []
    const current = new Date(startDate)
    current.setDate(1) // Start from first day of month

    while (current <= endDate) {
      periods.push(current.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      }))
      current.setMonth(current.getMonth() + 1)
    }

    return periods
  }

  const generateQuarterlyPeriods = (startDate: Date, endDate: Date): string[] => {
    const periods: string[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      periods.push(getQuarterPeriod(current))
      current.setMonth(current.getMonth() + 3)
    }

    return periods
  }

  const generateYearlyPeriods = (startDate: Date, endDate: Date): string[] => {
    const periods: string[] = []
    const startYear = startDate.getFullYear()
    const endYear = endDate.getFullYear()

    for (let year = startYear; year <= endYear; year++) {
      periods.push(year.toString())
    }

    return periods
  }

  const getQuarterPeriod = (date: Date): string => {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear()}`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Cash Flow Analysis</h3>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-[400px] w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading cash flow data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cash Flow Analysis</h3>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="h-[400px] w-full">
        {cashFlowData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">No transaction data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Upload some transactions to see your cash flow analysis
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={cashFlowData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6B7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: '#6B7280' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Card className="p-3 border bg-background shadow-lg">
                        <p className="font-medium mb-2 text-foreground">{label}</p>
                        {payload.map((entry, index) => (
                          <p key={index} className="text-sm flex justify-between items-center gap-4" style={{ color: entry.color }}>
                            <span>{entry.name}:</span>
                            <span className="font-semibold">${entry.value?.toLocaleString()}</span>
                          </p>
                        ))}
                      </Card>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              <Bar
                dataKey="moneyIn"
                fill="#10B981"
                name="Money In"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="moneyOut"
                fill="#F59E0B"
                name="Money Out"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="leftover"
                fill="#3B82F6"
                name="Net Cash Flow"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
