import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Download, RefreshCw } from "lucide-react"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

const TransferTransactions = () => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Query specifically for transfer transactions
  const { data: transferStats } = useQuery({
    queryKey: ['transfer-stats', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('category', 'Transfer')
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalTransfers = data?.length || 0;
      const totalAmount = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      // Calculate net transfer (transfers in - transfers out)
      const transfersIn = data?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
      const transfersOut = data?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const netTransfer = transfersIn - transfersOut;
      
      // Find potential internal transfers (matching amounts on same or close dates)
      const potentialInternalTransfers: any[] = [];
      
      if (data && data.length > 1) {
        for (let i = 0; i < data.length; i++) {
          for (let j = i + 1; j < data.length; j++) {
            const t1 = data[i];
            const t2 = data[j];
            
            // Check if amounts are opposite (one positive, one negative) and similar magnitude
            if (Math.abs(t1.amount + t2.amount) < 0.01) {
              // Check if dates are within 3 days of each other
              const date1 = new Date(t1.date);
              const date2 = new Date(t2.date);
              const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
              
              if (daysDiff <= 3) {
                potentialInternalTransfers.push({
                  transaction1: t1,
                  transaction2: t2,
                  daysDifference: daysDiff
                });
              }
            }
          }
        }
      }

      return {
        totalTransfers,
        totalAmount,
        transfersIn,
        transfersOut,
        netTransfer,
        potentialInternalTransfers,
        recentTransfers: data?.slice(0, 5) || []
      };
    },
    enabled: !!session?.user,
  });

  const exportTransfers = async () => {
    if (!session?.user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('category', 'Transfer')
      .order('date', { ascending: false });

    if (error || !data) {
      console.error('Error exporting transfers:', error);
      return;
    }

    // Convert to CSV
    const headers = ['Date', 'Description', 'Amount', 'Currency', 'Category'];
    const csvContent = [
      headers.join(','),
      ...data.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.currency,
        t.category
      ].join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const autoCategorizeInternalTransfers = async () => {
    if (!session?.user || !transferStats?.potentialInternalTransfers.length) return;

    try {
      // Update all potential internal transfer pairs to "Internal Transfer" category
      const updatePromises = transferStats.potentialInternalTransfers.map(pair => {
        const updates = [
          supabase
            .from('transactions')
            .update({ category: 'Internal Transfer' })
            .eq('id', pair.transaction1.id),
          supabase
            .from('transactions')
            .update({ category: 'Internal Transfer' })
            .eq('id', pair.transaction2.id)
        ];
        return Promise.all(updates);
      });

      await Promise.all(updatePromises);

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ['transfer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast({
        title: "Internal Transfers Categorized",
        description: `Successfully categorized ${transferStats.potentialInternalTransfers.length * 2} transactions as "Internal Transfer"`,
      });
    } catch (error) {
      console.error('Error auto-categorizing internal transfers:', error);
      toast({
        title: "Error",
        description: "Failed to categorize internal transfers. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Transfer Transactions</h1>
            </div>
            <p className="text-muted-foreground">
              View and analyze transfer transactions to identify internal account transfers
            </p>
          </div>
          <Button 
            onClick={exportTransfers}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Transfers
          </Button>
        </header>

        {/* Statistics Cards */}
        {transferStats && (
          <div className="space-y-6">
            {/* Transfer Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Potential Internal Transfers</h3>
                <p className="text-2xl font-bold mt-2">{transferStats.potentialInternalTransfers.length}</p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Transfers In</h3>
                <p className="text-2xl font-bold mt-2 text-green-600">
                  +${transferStats.transfersIn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Transfers Out</h3>
                <p className="text-2xl font-bold mt-2 text-red-600">
                  -${transferStats.transfersOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Net Transfer</h3>
                <p className={`text-2xl font-bold mt-2 ${transferStats.netTransfer >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transferStats.netTransfer >= 0 ? '+' : ''}${transferStats.netTransfer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Potential Internal Transfers Alert */}
        {transferStats && transferStats.potentialInternalTransfers.length > 0 && (
          <Card className="p-6 border-yellow-500/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  Potential Internal Transfers Detected
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                We found {transferStats.potentialInternalTransfers.length} pairs of transactions that might be internal transfers between your accounts.
                These are transfers with matching amounts (opposite signs) occurring within 3 days of each other.
              </p>
              <div className="space-y-3 mt-4">
                {transferStats.potentialInternalTransfers.slice(0, 3).map((pair: any, index: number) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{pair.transaction1.description}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(pair.transaction1.date), 'MMM dd, yyyy')} • 
                          <span className={pair.transaction1.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {' '}${Math.abs(pair.transaction1.amount).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{pair.transaction2.description}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(pair.transaction2.date), 'MMM dd, yyyy')} • 
                          <span className={pair.transaction2.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                            {' '}${Math.abs(pair.transaction2.amount).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={autoCategorizeInternalTransfers}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Auto-Categorize as Internal Transfers
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Modified TransactionList - We'll need to pass a filter prop */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Transfer Transactions</h2>
          <TransferTransactionList />
        </div>
      </div>
    </div>
  );
};

// Custom component that wraps TransactionList with transfer filter
const TransferTransactionList = () => {
  const { session } = useAuth();
  
  return (
    <Card className="animate-fadeIn">
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Note: The transactions below are filtered to show only those categorized as "Transfer".
          You can edit individual transactions to update their categories if needed.
        </p>
        <TransactionList initialCategoryFilter="Transfer" />
      </div>
    </Card>
  );
};

export default TransferTransactions;