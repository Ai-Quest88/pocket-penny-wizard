
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionListProps {
  entityId?: string;
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "$"
};

export const TransactionList = ({ entityId }: TransactionListProps) => {
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      console.log('Fetching transactions...');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }
      
      console.log('Fetched transactions:', data);
      return data;
    },
  });

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (!exchangeRates || fromCurrency === displayCurrency) return amount;
    const rate = exchangeRates[fromCurrency];
    return amount / rate * exchangeRates[displayCurrency];
  };

  // Calculate running balance
  const calculateBalance = (index: number): number => {
    let balance = 0;
    for (let i = transactions.length - 1; i >= index; i--) {
      const convertedAmount = convertAmount(transactions[i].amount, transactions[i].currency);
      balance += convertedAmount;
    }
    return balance;
  };

  if (isLoading) {
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    console.error('Transaction loading error:', error);
    return (
      <Card className="animate-fadeIn">
        <div className="p-6">
          <div className="text-center">
            <p className="text-destructive">Error loading transactions</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="animate-fadeIn">
      <div className="p-6 border-b border-accent">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
          <div className="w-32">
            <Select
              value={displayCurrency}
              onValueChange={setDisplayCurrency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(currencySymbols).map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currencySymbols[currency]} {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="p-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first transaction or upload a CSV file to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => {
                  const convertedAmount = convertAmount(
                    transaction.amount,
                    transaction.currency
                  );
                  const balance = calculateBalance(index);
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className={cn(
                            "font-semibold",
                            convertedAmount > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {convertedAmount > 0 ? "+" : ""}
                            {currencySymbols[displayCurrency]}
                            {Math.abs(convertedAmount).toFixed(2)}
                          </p>
                          {transaction.currency !== displayCurrency && (
                            <p className="text-xs text-muted-foreground">
                              {currencySymbols[transaction.currency]}{Math.abs(transaction.amount).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold">
                          {currencySymbols[displayCurrency]}
                          {Math.abs(balance).toFixed(2)}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
