
import { CurrencySelector } from "./CurrencySelector";

interface TransactionListHeaderProps {
  displayCurrency: string;
  onCurrencyChange: (currency: string) => void;
  currencySymbols: Record<string, string>;
}

export const TransactionListHeader = ({
  displayCurrency,
  onCurrencyChange,
  currencySymbols,
}: TransactionListHeaderProps) => {
  return (
    <div className="p-6 border-b border-accent">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
        <CurrencySelector
          displayCurrency={displayCurrency}
          onCurrencyChange={onCurrencyChange}
          currencySymbols={currencySymbols}
        />
      </div>
    </div>
  );
};
