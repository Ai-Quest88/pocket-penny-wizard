
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency: string;
  comment?: string;
}

interface TransactionInfoProps {
  transaction: Transaction;
}

export const TransactionInfo = ({ transaction }: TransactionInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">Amount</p>
          <p className="text-lg font-semibold">
            {transaction.amount > 0 ? "+" : ""}
            ${Math.abs(transaction.amount).toFixed(2)}
          </p>
        </div>
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">Date</p>
          <p className="text-lg font-semibold">
            {new Date(transaction.date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-muted p-3 rounded-lg mb-4">
        <p className="text-sm text-muted-foreground">Description</p>
        <p className="font-medium">{transaction.description}</p>
      </div>
    </>
  );
};
