import { Card } from "@/components/ui/card"
import { Lightbulb, AlertCircle, TrendingUp, TrendingDown, Info } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AIInsight {
  type: 'warning' | 'savings' | 'trend' | 'recommendation'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
}

const getInsightColor = (type: string, impact: string) => {
  if (type === 'warning') return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
  if (type === 'savings') return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
  if (type === 'trend') return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
  return 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
}

const getInsightIcon = (type: string) => {
  if (type === 'warning') return <AlertCircle className="h-4 w-4 text-red-500" />
  if (type === 'savings') return <TrendingDown className="h-4 w-4 text-green-500" />
  if (type === 'trend') return <TrendingUp className="h-4 w-4 text-blue-500" />
  return <Info className="h-4 w-4 text-purple-500" />
}

export const SmartInsights = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['smart-insights'],
    queryFn: async () => {
      // Ensure we send the authenticated user's JWT to the edge function
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        throw new Error('User is not authenticated')
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ dateRange: 90 })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('analyze-transactions error:', response.status, errorText)
        throw new Error(`Failed to load insights: ${response.status}`)
      }

      const data = await response.json()
      return data as { insights: AIInsight[], summary: any, analyzedTransactions: number }
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-semibold">Smart Insights</h2>
        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            Based on {data.analyzedTransactions} transactions
          </span>
        )}
      </div>
      
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load insights. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {data && data.insights.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Not enough transaction data to generate insights. Add more transactions to get personalized financial advice.
          </AlertDescription>
        </Alert>
      )}

      {data && data.insights.length > 0 && (
        <div className="grid gap-4">
          {data.insights.map((insight, index) => (
            <Card
              key={index}
              className={`p-4 border-l-4 ${getInsightColor(insight.type, insight.impact)}`}
            >
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    {insight.impact === 'high' && (
                      <span className="text-xs bg-background px-2 py-0.5 rounded-full border">
                        High Impact
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.actionable && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      💡 This is actionable - consider taking steps to address it
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  )
}