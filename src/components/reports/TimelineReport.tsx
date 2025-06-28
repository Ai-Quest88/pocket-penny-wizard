import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns"
import { Search, Calendar, DollarSign, MessageCircle, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"

interface TimelineTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  displayAmount: number;
}

export function TimelineReport() {
  const { session } = useAuth();
  const { displayCurrency, formatCurrency, convertAmount } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['timeline-report', session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user) return [];

      // Get last 30 days of transactions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, date, description, amount, currency, category')
        .eq('user_id', session.user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!transactions) return [];

      // Convert amounts to display currency and group by date
      const groupedTransactions: { [key: string]: TimelineTransaction[] } = {};

      transactions.forEach(transaction => {
        const displayAmount = convertAmount(
          Number(transaction.amount),
          transaction.currency || 'AUD'
        );

        const timelineTransaction: TimelineTransaction = {
          ...transaction,
          displayAmount
        };

        const dateKey = transaction.date;
        if (!groupedTransactions[dateKey]) {
          groupedTransactions[dateKey] = [];
        }
        groupedTransactions[dateKey].push(timelineTransaction);
      });

      // Sort dates and return structured data
      return Object.entries(groupedTransactions)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, transactions]) => ({
          date,
          transactions,
          totalIncome: transactions
            .filter(t => t.displayAmount > 0)
            .reduce((sum, t) => sum + t.displayAmount, 0),
          totalExpenses: Math.abs(transactions
            .filter(t => t.displayAmount < 0)
            .reduce((sum, t) => sum + t.displayAmount, 0)),
          netAmount: transactions.reduce((sum, t) => sum + t.displayAmount, 0)
        }));
    },
    enabled: !!session?.user,
  });

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM d, yyyy");
  };

  const getCategoryIcon = (category: string) => {
    if (category?.toLowerCase().includes('income') || category?.toLowerCase().includes('salary')) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const filteredData = timelineData?.filter(dayData =>
    dayData.transactions.some(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Transaction Timeline ({displayCurrency})</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading timeline data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Transaction Timeline ({displayCurrency})</h2>
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Recent Transactions</h3>
          <p className="text-muted-foreground">
            Add some transactions to see your financial timeline
          </p>
        </Card>
      </div>
    );
  }

  // Calculate summary statistics
  const totalTransactions = timelineData.reduce((sum, day) => sum + day.transactions.length, 0);
  const totalIncome = timelineData.reduce((sum, day) => sum + day.totalIncome, 0);
  const totalExpenses = timelineData.reduce((sum, day) => sum + day.totalExpenses, 0);
  const netChange = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Transaction Timeline ({displayCurrency})</h2>
        <p className="text-sm text-muted-foreground">
          Track your daily financial activity and spending patterns over the last 30 days
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Transactions</p>
          </div>
          <p className="text-xl font-semibold">{totalTransactions}</p>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">Total Income</p>
          </div>
          <p className="text-xl font-semibold text-green-600">
            {formatCurrency(totalIncome)}
          </p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </div>
          <p className="text-xl font-semibold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </Card>
        <Card className={`p-4 ${netChange >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-2">
            {netChange >= 0 ? 
              <TrendingUp className="h-4 w-4 text-blue-600" /> : 
              <TrendingDown className="h-4 w-4 text-orange-600" />
            }
            <p className="text-sm text-muted-foreground">Net Change</p>
          </div>
          <p className={`text-xl font-semibold ${netChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(netChange)}
          </p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions, categories, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No timeline items found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search criteria or add some transactions to get started
            </p>
          </Card>
        ) : (
          filteredData.map((dayData, index) => (
            <Card key={dayData.date} className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{getDateLabel(dayData.date)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(dayData.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${dayData.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dayData.netAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dayData.transactions.length} transaction{dayData.transactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {dayData.transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(transaction.category)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.category || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.displayAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.displayAmount)}
                      </p>
                      {transaction.currency !== displayCurrency && (
                        <p className="text-xs text-muted-foreground">
                          {transaction.currency} {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredData.length >= 100 && (
        <div className="text-center">
          <Button variant="outline">Load More Transactions</Button>
        </div>
      )}
    </div>
  );
}
