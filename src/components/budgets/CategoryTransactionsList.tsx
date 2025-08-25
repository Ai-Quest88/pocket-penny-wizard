import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface CategoryTransactionsListProps {
  categoryName: string;
  timeRange: { start: string; end: string };
}

export function CategoryTransactionsList({ categoryName, timeRange }: CategoryTransactionsListProps) {
  const { session } = useAuth();
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["category-transactions", categoryName, timeRange.start, timeRange.end, session?.user?.id, displayCurrency],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("category_name", categoryName)
        .gte("date", timeRange.start)
        .lte("date", timeRange.end)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching category transactions:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions for {categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-3 bg-muted rounded w-24"></div>
                </div>
                <div className="h-6 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions for {categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No transactions found for this category in the selected time range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transactions for {categoryName}</span>
          <Badge variant="secondary">{transactions.length} transactions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const convertedAmount = convertAmount(transaction.amount, transaction.currency);
              
              return (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={convertedAmount < 0 ? "text-red-600" : "text-green-600"}>
                      {currencySymbols[displayCurrency]}{Math.abs(convertedAmount).toFixed(2)}
                    </span>
                    {transaction.currency !== displayCurrency && (
                      <div className="text-xs text-muted-foreground">
                        {currencySymbols[transaction.currency]}{Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
