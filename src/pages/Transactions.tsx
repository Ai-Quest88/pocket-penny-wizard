import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowLeftRight, Upload, Plus, Search } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SimpleUpload } from "@/components/transaction-forms/SimpleUpload"
import { UnifiedCsvUpload } from "@/components/transaction-forms/UnifiedCsvUpload"
import { ManualTransactionDialog } from "@/components/transactions/ManualTransactionDialog"
import { TransactionList } from "@/components/TransactionList"
import { DuplicateDetector } from "@/components/transactions/DuplicateDetector"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { useEffect } from "react"
const Transactions = () => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [showDuplicateDetector, setShowDuplicateDetector] = useState(false);
  const [showAdvancedUpload, setShowAdvancedUpload] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Open upload or manual dialog from URL (e.g. from Dashboard empty state)
  useEffect(() => {
    const openUploadVal = searchParams.get('openUpload');
    const openManualVal = searchParams.get('openManual');
    if (openUploadVal === '1') setIsUploadDialogOpen(true);
    if (openManualVal === '1') setIsManualDialogOpen(true);
    if (openUploadVal === '1' || openManualVal === '1') {
      const next = new URLSearchParams(searchParams);
      next.delete('openUpload');
      next.delete('openManual');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleTransactionUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    setShowAdvancedUpload(false);
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Search and filter below.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="gap-2"
              onClick={() => setIsUploadDialogOpen(true)}
              data-testid="transactions-upload-csv-button"
            >
              <Upload className="h-4 w-4" />
              Add transactions
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDuplicateDetector(true)} data-testid="transactions-find-duplicates-button">
                  <Search className="h-4 w-4 mr-2" />
                  Find duplicates
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/transactions/transfers" data-testid="transactions-view-transfers-button">
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    View transfers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsManualDialogOpen(true)} data-testid="transactions-add-manual-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add one manually
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={isUploadDialogOpen} onOpenChange={(open) => { setIsUploadDialogOpen(open); if (!open) setShowAdvancedUpload(false); }}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add transactions</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {showAdvancedUpload ? (
                    <>
                      <UnifiedCsvUpload onComplete={handleTransactionUploadSuccess} />
                      <p className="mt-4 text-sm text-muted-foreground">
                        <button type="button" className="underline hover:no-underline" onClick={() => setShowAdvancedUpload(false)}>
                          Back to simple upload
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <SimpleUpload onComplete={handleTransactionUploadSuccess} />
                      <p className="mt-4 text-sm text-muted-foreground">
                        <button type="button" className="underline hover:no-underline" onClick={() => setShowAdvancedUpload(true)}>
                          Having trouble? Map columns manually
                        </button>
                      </p>
                    </>
                  )}
                </div>
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
          <TransactionList onAddTransactionsClick={() => setIsUploadDialogOpen(true)} />
        )}
      </div>
    </div>
  )
}

export default Transactions
