
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetWorthReport } from "@/components/reports/NetWorthReport"
import { AssetsReport } from "@/components/reports/AssetsReport"
import { LiabilitiesReport } from "@/components/reports/LiabilitiesReport"
import { IncomeExpenseReport } from "@/components/reports/IncomeExpenseReport"
import { CashFlowReport } from "@/components/reports/CashFlowReport"
import { TrendsReport } from "@/components/reports/TrendsReport"
import { TimelineReport } from "@/components/reports/TimelineReport"
import { DigestReport } from "@/components/reports/DigestReport"
import { useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

export default function Reports() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("net-worth")

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
          <h1 className="text-3xl font-bold text-text">Financial Reports</h1>
          <p className="text-text-muted">Comprehensive analysis of your financial position and performance</p>
        </header>

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
      </div>
    </div>
  )
}
