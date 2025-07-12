import { Button } from "@/components/ui/button"
import { PlusCircle, ArrowLeftRight, Search, Filter } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UnifiedCsvUpload } from "@/components/transaction-forms/UnifiedCsvUpload"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Transaction } from "@/types/transaction-forms"

const Transfers = () => {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();

  console.log("Transfers component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }

  console.log("Rendering Transfers component");

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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Transfers</h1>
                <p className="text-muted-foreground">Track internal transfers and identify patterns</p>
              </div>
            </div>
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
                  <UnifiedCsvUpload onComplete={handleTransactionUploadSuccess} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Transfer Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Transfer Insights
            </CardTitle>
            <CardDescription>
              Analyze your transfer patterns to identify internal movements between accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transfers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Transfer Category Only
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom TransactionList for Transfers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Transfer Transactions</h2>
            <Badge variant="outline" className="text-xs">
              Showing only "Transfer" category
            </Badge>
          </div>
          
          {/* We'll create a custom component that filters for transfers only */}
          <TransferTransactionList 
            searchTerm={searchTerm}
            dateFilter={dateFilter}
          />
        </div>
      </div>
    </div>
  )
}

// Custom component that shows only transfer transactions
const TransferTransactionList = ({ searchTerm, dateFilter }: { searchTerm: string; dateFilter: string }) => {
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transfers', session?.user?.id, searchTerm, dateFilter],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No authenticated user, returning empty transfers');
        return [];
      }

      console.log('Fetching transfer transactions for user:', session.user.id);
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('category', 'Transfer') // Only get Transfer category transactions
        .order('date', { ascending: false });

      // Apply date filter
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('date', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching transfer transactions:', error);
        throw error;
      }
      
      console.log('Fetched transfer transactions:', data?.length);

      // Filter by search term if provided
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(transaction =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return filteredData;
    },
    enabled: !!session?.user,
  });

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleTransactionDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading transfers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-destructive">Error loading transfers: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Transfer Transactions</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || dateFilter !== 'all' 
                ? "No transfers match your current filters. Try adjusting your search criteria."
                : "You haven't recorded any transfer transactions yet. Add some transactions to get started."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-left p-4 font-medium">Account</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className="border-b hover:bg-muted/30 cursor-pointer"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <td className="p-4">
                    <div className="text-sm font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{transaction.description}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {convertAmount(transaction.amount, transaction.currency, displayCurrency).toFixed(2)}
                      {currencySymbols[displayCurrency]}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">
                      {transaction.asset_account_id || transaction.liability_account_id || 'Unknown Account'}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default Transfers