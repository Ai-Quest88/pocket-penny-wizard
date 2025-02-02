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

const transactions: Transaction[] = [
  {
    id: 1,
    description: "Grocery Shopping",
    amount: -120.50,
    category: "Food",
    date: "2024-03-20",
    currency: "USD"
  },
  {
    id: 2,
    description: "Salary Deposit",
    amount: 3000.00,
    category: "Income",
    date: "2024-03-19",
    currency: "EUR"
  },
  {
    id: 3,
    description: "Netflix Subscription",
    amount: -15.99,
    category: "Entertainment",
    date: "2024-03-18",
    currency: "GBP"
  },
];

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥"
};

export const TransactionList = ({ entityId }: TransactionListProps) => {
  const [displayCurrency, setDisplayCurrency] = useState("USD");

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
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-4">
          {transactions.map((transaction) => {
            const convertedAmount = convertAmount(
              transaction.amount,
              transaction.currency
            );
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-background-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-text">{transaction.description}</p>
                  <p className="text-sm text-text-muted">
                    {transaction.category}
                    <span className="ml-2 text-xs">
                      (Original: {currencySymbols[transaction.currency]}{Math.abs(transaction.amount).toFixed(2)})
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    convertedAmount > 0 ? "text-success" : "text-text"
                  )}>
                    {convertedAmount > 0 ? "+" : ""}
                    {currencySymbols[displayCurrency]}
                    {Math.abs(convertedAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-text-muted">{transaction.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
