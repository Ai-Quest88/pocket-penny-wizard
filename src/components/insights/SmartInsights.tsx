import { Card } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface Insight {
  id: string
  title: string
  description: string
  type: "positive" | "negative" | "neutral"
}

// Dummy insights data
const dummyInsights: Insight[] = [
  {
    id: "budget-housing",
    title: "Housing Budget",
    description: "You're currently under budget for housing expenses this month.",
    type: "positive"
  },
  {
    id: "spending-food",
    title: "Food Expenses",
    description: "Food expenses have increased by 15% compared to last month.",
    type: "negative"
  },
  {
    id: "transport-savings",
    title: "Transport Savings",
    description: "You've reduced transport costs by using public transit more.",
    type: "positive"
  },
  {
    id: "entertainment-budget",
    title: "Entertainment Spending",
    description: "Entertainment spending is within the planned budget.",
    type: "neutral"
  }
]

export const SmartInsights = () => {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-semibold">Smart Insights</h2>
      </div>
      
      <div className="grid gap-4">
        {dummyInsights.map((insight) => (
          <Card
            key={insight.id}
            className={`p-4 border-l-4 ${
              insight.type === "positive"
                ? "border-l-green-500 bg-green-50/50"
                : insight.type === "negative"
                ? "border-l-red-500 bg-red-50/50"
                : "border-l-blue-500 bg-blue-50/50"
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