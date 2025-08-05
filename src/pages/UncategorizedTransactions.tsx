
import { useState } from "react"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"

const UncategorizedTransactions = () => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  console.log("UncategorizedTransactions component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }



  console.log("Rendering UncategorizedTransactions component");

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Uncategorized Transactions</h1>
            <p className="text-muted-foreground">Transactions that need to be categorized</p>
          </div>
        </header>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Transactions that need manual categorization. Click on any transaction to categorize it and optionally create rules for future similar transactions.
            </p>
            
            <TransactionList 
              filterCategory="Uncategorized" 
              onTransactionSelect={setSelectedTransaction}
            />
          </div>
        </Card>

      </div>
    </div>
  )
}

export default UncategorizedTransactions
