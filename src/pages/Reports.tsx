
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetWorthReport } from "@/components/reports/NetWorthReport"
import { AssetsReport } from "@/components/reports/AssetsReport"
import { LiabilitiesReport } from "@/components/reports/LiabilitiesReport"
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
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Income and Expense Statement</h2>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Export Excel
                    </button>
                    <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
                      Export CSV
                    </button>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Personal profit and loss report showing earnings and spending categories with budget comparisons.
                </p>
                <div className="bg-muted/20 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">Income and Expense Statement content will be implemented here</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="cash-flow">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Cash Flow Statement</h2>
                  <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
                    Export CSV
                  </button>
                </div>
                <p className="text-muted-foreground">
                  Forecasts monthly cash flows with past and future finances in spreadsheet format.
                </p>
                <div className="bg-muted/20 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">Cash Flow Statement content will be implemented here</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Trends Analysis</h2>
                <p className="text-muted-foreground">
                  Identify patterns in earnings and spending with interactive bar charts and budget comparisons.
                </p>
                <div className="bg-muted/20 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">Trends Analysis content will be implemented here</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Financial Timeline</h2>
                <p className="text-muted-foreground">
                  Store financial memories including transactions with notes, images, and attachments.
                </p>
                <div className="bg-muted/20 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">Financial Timeline content will be implemented here</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="digest">
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Digest Report</h2>
                <p className="text-muted-foreground">
                  Comprehensive report with graphs, charts, and visual representations of your financial habits.
                </p>
                <div className="bg-muted/20 p-8 rounded-lg text-center">
                  <p className="text-muted-foreground">Digest Report content will be implemented here</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
