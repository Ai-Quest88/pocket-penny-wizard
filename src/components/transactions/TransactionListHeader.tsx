import { CurrencySelector } from "./CurrencySelector";

interface TransactionListHeaderProps {
  displayCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export const TransactionListHeader = ({
  displayCurrency,
  onCurrencyChange,
}: TransactionListHeaderProps) => {
  return (
    <div className="p-6 border-b border-accent">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
        <CurrencySelector
          displayCurrency={displayCurrency}
          onCurrencyChange={onCurrencyChange}
          variant="compact"
        />
      </div>
    </div>
  );
};
