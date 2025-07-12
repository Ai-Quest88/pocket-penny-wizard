import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/currencyUtils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
}

interface TransactionInfoProps {
  transaction: Transaction;
}

export function TransactionInfo({ transaction }: TransactionInfoProps) {
  const { displayCurrency, convertAmount, currencySymbols } = useCurrency();
  
  const convertedAmount = convertAmount(transaction.amount, transaction.currency);
  
  return (
    <div className="p-4 border rounded-lg bg-muted/30">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-lg">{transaction.description}</h4>
        <div className="text-right">
          <p className={`text-lg font-semibold ${convertedAmount > 0 ? "text-green-600" : "text-red-600"}`}>
            {convertedAmount > 0 ? "+" : ""}
            {formatCurrency(Math.abs(convertedAmount), displayCurrency)}
          </p>
          {transaction.currency !== displayCurrency && (
            <p className="text-sm text-muted-foreground">
              {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Badge variant="secondary">{transaction.category}</Badge>
        <span className="text-sm text-muted-foreground">{transaction.date}</span>
      </div>
    </div>
  );
}
