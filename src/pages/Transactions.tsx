
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import UnifiedCsvUpload from "@/components/transaction-forms/UnifiedCsvUpload"
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

  const handleTransactionUploadSuccess = () => {
    console.log("Transaction upload completed successfully, closing dialog");
    setIsAddingTransaction(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log("Dialog open state changing to:", open);
    setIsAddingTransaction(open);
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage your transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isAddingTransaction} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    console.log("Add Transaction button clicked");
                    setIsAddingTransaction(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Transactions</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <UnifiedCsvUpload onSuccess={handleTransactionUploadSuccess} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <TransactionList />
      </div>
    </div>
  )
}

export default Transactions
