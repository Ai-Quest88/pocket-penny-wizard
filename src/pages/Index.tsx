import { Button } from "@/components/ui/button"
import { ExpenseChart } from "@/components/ExpenseChart"
import { TransactionList } from "@/components/TransactionList"
import { PlusCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { AccountManager } from "@/components/AccountManager"

const Index = () => {
  const navigate = useNavigate()

  return (
    <div className="container p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back!</p>
          </div>
          <Button onClick={() => navigate("/transactions/import")}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Import Transactions
          </Button>
        </header>

        <AccountManager />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseChart />
          <TransactionList />
        </div>
      </div>
    </div>
  )
}

export default Index