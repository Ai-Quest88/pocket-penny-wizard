
import { useState } from "react"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"

const UncategorizedTransactions = () => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Uncategorized</h1>
            <p className="text-muted-foreground">Choose a category for each. We'll remember your choices for similar transactions.</p>
          </div>
        </header>

        <Card className="p-6">
          <TransactionList
            filterCategory="Uncategorized"
            onTransactionSelect={setSelectedTransaction}
          />
        </Card>
      </div>
    </div>
  )
}

export default UncategorizedTransactions
