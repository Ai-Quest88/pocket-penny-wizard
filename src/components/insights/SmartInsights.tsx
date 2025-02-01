import { Card } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"
import { monthlyData } from "@/components/budgets/IncomeExpenseAnalysis"

interface Insight {
  id: string
  title: string
  description: string
  type: "positive" | "negative" | "neutral"
}

const generateInsights = (data: typeof monthlyData): Insight[] => {
  const insights: Insight[] = []
  
  // Calculate month-over-month changes
  for (let i = 1; i < data.length; i++) {
    const currentMonth = data[i]
    const previousMonth = data[i - 1]
    
    // Income trend analysis
    const incomeDiff = currentMonth.income - previousMonth.income
    const incomeChangePercent = (incomeDiff / previousMonth.income) * 100
    
    if (Math.abs(incomeChangePercent) > 5) {
      insights.push({
        id: `income-trend-${i}`,
        title: `Income ${incomeDiff > 0 ? "Increase" : "Decrease"}`,
        description: `Your income has ${incomeDiff > 0 ? "increased" : "decreased"} by ${Math.abs(incomeChangePercent).toFixed(1)}% compared to last month`,
        type: incomeDiff > 0 ? "positive" : "negative"
      })
    }
    
    // Expense analysis
    const expenseDiff = currentMonth.expenses - previousMonth.expenses
    const expenseChangePercent = (expenseDiff / previousMonth.expenses) * 100
    
    if (Math.abs(expenseChangePercent) > 5) {
      insights.push({
        id: `expense-trend-${i}`,
        title: `Expense ${expenseDiff > 0 ? "Increase" : "Decrease"}`,
        description: `Your expenses have ${expenseDiff > 0 ? "increased" : "decreased"} by ${Math.abs(expenseChangePercent).toFixed(1)}% compared to last month`,
        type: expenseDiff > 0 ? "negative" : "positive"
      })
    }
    
    // Category analysis
    Object.entries(currentMonth.categories).forEach(([category, amount]) => {
      const previousAmount = previousMonth.categories[category]
      const categoryDiff = amount - previousAmount
      const categoryChangePercent = (categoryDiff / previousAmount) * 100
      
      if (Math.abs(categoryChangePercent) > 10) {
        insights.push({
          id: `category-${category}-${i}`,
          title: `${category} Spending Change`,
          description: `Spending in ${category} has ${categoryDiff > 0 ? "increased" : "decreased"} by ${Math.abs(categoryChangePercent).toFixed(1)}%`,
          type: categoryDiff > 0 ? "negative" : "positive"
        })
      }
    })
  }
  
  // Savings rate analysis
  const latestMonth = data[data.length - 1]
  const savingsRate = ((latestMonth.income - latestMonth.expenses) / latestMonth.income) * 100
  
  if (savingsRate < 20) {
    insights.push({
      id: "savings-rate",
      title: "Low Savings Rate",
      description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Consider reviewing expenses to increase savings.`,
      type: "negative"
    })
  } else if (savingsRate > 30) {
    insights.push({
      id: "savings-rate",
      title: "Healthy Savings Rate",
      description: `Great job! Your savings rate of ${savingsRate.toFixed(1)}% is above the recommended 20%.`,
      type: "positive"
    })
  }
  
  return insights
}

export const SmartInsights = () => {
  const insights = generateInsights(monthlyData)
  
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-semibold">Smart Insights</h2>
      </div>
      
      <div className="grid gap-4">
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={`p-4 border-l-4 ${
              insight.type === "positive"
                ? "border-l-green-500 bg-green-50"
                : insight.type === "negative"
                ? "border-l-red-500 bg-red-50"
                : "border-l-blue-500 bg-blue-50"
            }`}
          >
            <h3 className="font-semibold mb-1">{insight.title}</h3>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </Card>
        ))}
      </div>
    </Card>
  )
}