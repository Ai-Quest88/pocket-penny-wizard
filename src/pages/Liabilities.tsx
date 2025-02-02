import { useState, useEffect } from "react"
import { DashboardCard } from "@/components/DashboardCard"
import { LiabilitiesList } from "@/components/assets-liabilities/LiabilitiesList"
import { AddLiabilityDialog } from "@/components/assets-liabilities/AddLiabilityDialog"
import { Liability } from "@/types/assets-liabilities"
import { v4 as uuidv4 } from 'uuid'
import { useToast } from "@/components/ui/use-toast"

const initialLiabilities: Liability[] = [
  {
    id: "1",
    entityId: "personal",
    name: "Home Mortgage",
    amount: 320000,
    type: "mortgage",
    category: "home_loan",
    history: []
  },
  {
    id: "2",
    entityId: "business",
    name: "Business Loan",
    amount: 75000,
    type: "loan",
    category: "personal_loan",
    history: []
  },
  {
    id: "3",
    entityId: "personal",
    name: "Car Loan",
    amount: 25000,
    type: "loan",
    category: "auto_loan",
    history: []
  }
]

const Liabilities = () => {
  const { toast } = useToast()
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount, 0)
  const monthlyChange = -1.5 // This could be calculated based on historical data

  useEffect(() => {
    const savedLiabilities = localStorage.getItem('liabilities')
    if (savedLiabilities) {
      setLiabilities(JSON.parse(savedLiabilities))
    } else {
      setLiabilities(initialLiabilities)
      localStorage.setItem('liabilities', JSON.stringify(initialLiabilities))
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

  const handleEditLiability = (id: string, updatedLiability: Omit<Liability, "id">) => {
    const updatedLiabilities = liabilities.map(liability =>
      liability.id === id ? { ...updatedLiability, id } : liability
    )
    setLiabilities(updatedLiabilities)
    localStorage.setItem('liabilities', JSON.stringify(updatedLiabilities))
    toast({
      title: "Liability Updated",
      description: "Your liability has been updated successfully.",
    })
  }

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

        <DashboardCard
          title="Total Liabilities"
          value={`$${totalLiabilities.toLocaleString()}`}
          trend={{ value: Math.abs(monthlyChange), isPositive: false }}
          className="bg-card"
        />

        <LiabilitiesList 
          liabilities={liabilities} 
          onEditLiability={handleEditLiability}
        />
      </div>
    </div>
  )
}

export default Liabilities