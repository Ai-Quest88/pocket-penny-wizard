import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/DashboardCard"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"
import { Liability } from "@/types/assets-liabilities"
import { v4 as uuidv4 } from 'uuid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const Liabilities = () => {
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [entities, setEntities] = useState<any[]>([])
  
  const totalLiabilities = liabilities
    .filter(liability => selectedEntity === "all" || liability.entityId === selectedEntity)
    .reduce((sum, liability) => sum + liability.amount, 0)

  useEffect(() => {
    const savedLiabilities = localStorage.getItem('liabilities')
    if (savedLiabilities) {
      setLiabilities(JSON.parse(savedLiabilities))
    }

    // Load entities
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
    }
  }, [])

  const handleAddLiability = (newLiability: Omit<Liability, "id">) => {
    const liabilityWithId = {
      ...newLiability,
      id: uuidv4()
    }
    const updatedLiabilities = [...liabilities, liabilityWithId]
    setLiabilities(updatedLiabilities)
    localStorage.setItem('liabilities', JSON.stringify(updatedLiabilities))
  }

  const filteredLiabilities = liabilities.filter(
    liability => selectedEntity === "all" || liability.entityId === selectedEntity
  )

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Liabilities</h1>
            <p className="text-muted-foreground">Manage your liabilities</p>
          </div>
          <AddLiabilityDialog onAddLiability={handleAddLiability} />
        </header>

        <div className="flex items-center justify-between">
          <DashboardCard
            title="Total Liabilities"
            value={`$${totalLiabilities.toLocaleString()}`}
            trend={{ value: 2.5, isPositive: false }}
            className="flex-1 mr-4"
          />
          
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
        </div>

        <LiabilitiesList liabilities={filteredLiabilities} />
      </div>
    </div>
  )
}

export default Liabilities