import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/EmptyState"
import { NetWorthReport } from "@/components/reports/NetWorthReport"
import { AssetsReport } from "@/components/reports/AssetsReport"
import { LiabilitiesReport } from "@/components/reports/LiabilitiesReport"
import { IncomeExpenseReport } from "@/components/reports/IncomeExpenseReport"
import { CashFlowReport } from "@/components/reports/CashFlowReport"
import { TrendsReport } from "@/components/reports/TrendsReport"
import { TimelineReport } from "@/components/reports/TimelineReport"
import { DigestReport } from "@/components/reports/DigestReport"
import { useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
export default function Reports() {
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState("net-worth")

  const { data: transactionCount = 0 } = useQuery({
    queryKey: ["reports-transaction-count", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return 0
      const { count } = await supabase.from("transactions").select("*", { count: "exact", head: true }).eq("user_id", session.user.id)
      return count ?? 0
    },
    enabled: !!session?.user?.id,
  })

  const hasData = transactionCount > 0

  useEffect(() => {
    // Set active tab based on current route
    const pathMap: Record<string, string> = {
      "/reports": "net-worth",
      "/reports/income-expense": "income-expense",
      "/reports/cash-flow": "cash-flow",
      "/reports/trends": "trends",
      "/reports/timeline": "timeline",
      "/reports/digest": "digest"
    }
    
    const tab = pathMap[location.pathname]
    if (tab) {
      setActiveTab(tab)
    }
  }, [location.pathname])

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Reports</h1>
          <p className="text-text-muted">Spending and income over time</p>
        </header>

        {!hasData ? (
          <EmptyState
            title="Your reports are waiting"
            description="Once you add transactions, you'll see spending breakdowns, cash flow trends, and more."
            primaryAction={{ label: "Import bank statement", onClick: () => navigate("/transactions?openUpload=1") }}
          />
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="net-worth">Net Worth</TabsTrigger>
            <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="digest">Digest</TabsTrigger>
          </TabsList>

          <TabsContent value="net-worth">
            <div className="grid gap-6">
              <Card className="p-6">
                <NetWorthReport />
              </Card>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <AssetsReport />
                </Card>
                <Card className="p-6">
                  <LiabilitiesReport />
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="income-expense">
            <Card className="p-6">
              <IncomeExpenseReport />
            </Card>
          </TabsContent>

          <TabsContent value="cash-flow">
            <Card className="p-6">
              <CashFlowReport />
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="p-6">
              <TrendsReport />
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="p-6">
              <TimelineReport />
            </Card>
          </TabsContent>

          <TabsContent value="digest">
            <Card className="p-6">
              <DigestReport />
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  )
}
