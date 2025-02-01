import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetWorthReport } from "@/components/reports/NetWorthReport"
import { AssetsReport } from "@/components/reports/AssetsReport"
import { LiabilitiesReport } from "@/components/reports/LiabilitiesReport"

export default function Reports() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-text">Financial Reports</h1>
          <p className="text-text-muted">Detailed analysis of your financial position</p>
        </header>

        <Tabs defaultValue="net-worth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="net-worth">Net Worth</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
          </TabsList>

          <TabsContent value="net-worth">
            <Card className="p-6">
              <NetWorthReport />
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="p-6">
              <AssetsReport />
            </Card>
          </TabsContent>

          <TabsContent value="liabilities">
            <Card className="p-6">
              <LiabilitiesReport />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}