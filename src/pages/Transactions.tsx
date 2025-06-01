import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ImportTransactions from "./ImportTransactions"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const Transactions = () => {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();

  console.log("Transactions component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }

  console.log("Rendering Transactions component");

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage your transactions</p>
          </div>
          <div className="flex items-center">
            <Sheet open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
              <SheetTrigger asChild>
                <Button 
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => console.log("Add Transaction button clicked")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Add New Transaction</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ImportTransactions onSuccess={() => setIsAddingTransaction(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <TransactionList />
      </div>
    </div>
  )
}

export default Transactions
