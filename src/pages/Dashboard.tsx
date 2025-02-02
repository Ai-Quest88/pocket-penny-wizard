import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/DashboardCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Dashboard = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [entities, setEntities] = useState<any[]>([])

  useEffect(() => {
    // Load entities from localStorage
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
    }
  }, [])

  // Calculate totals based on selected entity
  const calculateTotals = () => {
    try {
      const assets = JSON.parse(localStorage.getItem('assets') || '[]')
      const liabilities = JSON.parse(localStorage.getItem('liabilities') || '[]')

      const filteredAssets = selectedEntity === "all" 
        ? assets 
        : assets.filter((asset: any) => asset.entityId === selectedEntity)
      
      const filteredLiabilities = selectedEntity === "all"
        ? liabilities
        : liabilities.filter((liability: any) => liability.entityId === selectedEntity)

      const totalAssets = filteredAssets.reduce((sum: number, asset: any) => sum + asset.value, 0)
      const totalLiabilities = filteredLiabilities.reduce((sum: number, liability: any) => sum + liability.amount, 0)
      const netWorth = totalAssets - totalLiabilities

      return {
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth
      }
    } catch (error) {
      console.error('Error calculating totals:', error)
      return {
        assets: 0,
        liabilities: 0,
        netWorth: 0
      }
    }
  }

  const totals = calculateTotals()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back!</p>
          </div>
          <Select
            value={selectedEntity}
            onValueChange={setSelectedEntity}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <DashboardCard
            title="Total Assets"
            value={`$${totals.assets.toLocaleString()}`}
            trend={{ value: 2.5, isPositive: true }}
          />
          <DashboardCard
            title="Total Liabilities"
            value={`$${totals.liabilities.toLocaleString()}`}
            trend={{ value: 1.2, isPositive: false }}
          />
          <DashboardCard
            title="Net Worth"
            value={`$${totals.netWorth.toLocaleString()}`}
            trend={{ value: 3.8, isPositive: true }}
          />
        </div>

        {/* Add other dashboard components here */}
      </div>
    </div>
  )
}

export default Dashboard