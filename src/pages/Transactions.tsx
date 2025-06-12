
import { Button } from "@/components/ui/button"
import { PlusCircle, TestTube } from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ImportTransactions from "./ImportTransactions"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { testGroqConnection } from "@/utils/aiCategorization"
import { useToast } from "@/hooks/use-toast"

const Transactions = () => {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [isTestingApi, setIsTestingApi] = useState(false)
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  console.log("Transactions component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }

  const handleTestGroqApi = async () => {
    setIsTestingApi(true);
    try {
      const result = await testGroqConnection();
      if (result.success) {
        toast({
          title: "Success",
          description: "Groq API connection successful! AI categorization should work now.",
        });
      } else {
        toast({
          title: "API Test Failed",
          description: `Groq API error: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test Groq API connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  console.log("Rendering Transactions component");

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage your transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleTestGroqApi}
              disabled={isTestingApi}
            >
              <TestTube className="h-4 w-4" />
              {isTestingApi ? "Testing..." : "Test AI API"}
            </Button>
            <Dialog open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => console.log("Add Transaction button clicked")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <ImportTransactions onSuccess={() => setIsAddingTransaction(false)} />
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
