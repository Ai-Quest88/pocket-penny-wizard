import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeftRight, Upload, Plus, Search, Sparkles, Settings2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SimpleUpload } from "@/components/transaction-forms/SimpleUpload"
import { UnifiedCsvUpload } from "@/components/transaction-forms/UnifiedCsvUpload"
import { ManualTransactionDialog } from "@/components/transactions/ManualTransactionDialog"
import { TransactionList } from "@/components/TransactionList"
import { DuplicateDetector } from "@/components/transactions/DuplicateDetector"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link } from "react-router-dom"
const Transactions = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [showDuplicateDetector, setShowDuplicateDetector] = useState(false);
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
    setIsUploadDialogOpen(false);
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
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowDuplicateDetector(true)}
              data-testid="transactions-find-duplicates-button"
            >
              <Search className="h-4 w-4" />
              Find Duplicates
            </Button>
            
            <Link to="/transactions/transfers">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                data-testid="transactions-view-transfers-button"
              >
                <ArrowLeftRight className="h-4 w-4" />
                View Transfers
              </Button>
            </Link>
            
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsManualDialogOpen(true)}
              data-testid="transactions-add-manual-button"
            >
              <Plus className="h-4 w-4" />
              Add Manually
            </Button>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="transactions-upload-csv-button"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Transaction Upload
                  </DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="simple" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="simple" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI-Powered (Recommended)
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Advanced
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="simple">
                    <SimpleUpload onComplete={handleTransactionUploadSuccess} />
                  </TabsContent>
                  <TabsContent value="advanced">
                    <UnifiedCsvUpload onComplete={handleTransactionUploadSuccess} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <ManualTransactionDialog 
              open={isManualDialogOpen} 
              onOpenChange={setIsManualDialogOpen} 
            />
          </div>
        </header>

        {showDuplicateDetector ? (
          <DuplicateDetector onClose={() => setShowDuplicateDetector(false)} />
        ) : (
          <TransactionList />
        )}
      </div>
    </div>
  )
}

export default Transactions
