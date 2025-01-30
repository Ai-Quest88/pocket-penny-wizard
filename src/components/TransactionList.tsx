import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
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

export const TransactionList = () => {
  return (
    <Card className="animate-fadeIn">
      <div className="p-6 border-b border-accent">
        <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-4 space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-background-muted transition-colors"
            >
              <div>
                <p className="font-medium text-text">{transaction.description}</p>
                <p className="text-sm text-text-muted">{transaction.category}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-semibold",
                  transaction.amount > 0 ? "text-success" : "text-text"
                )}>
                  {transaction.amount > 0 ? "+" : ""}
                  {currencySymbols[transaction.currency] || "$"}
                  {Math.abs(transaction.amount).toFixed(2)}
                </p>
                <p className="text-sm text-text-muted">{transaction.date}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};