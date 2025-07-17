import { CurrencySelector } from "./CurrencySelector";
import { TransactionSearch } from "./TransactionSearch";
import { formatCurrency } from "@/utils/currencyUtils";

interface SearchFilters {
  searchTerm: string;
  category: string;
  dateRange: string;
  amountRange: string;
}

interface TransactionListHeaderProps {
  displayCurrency: string;
  onCurrencyChange: (currency: string) => void;
  searchFilters: SearchFilters;
  onSearchFiltersChange: (filters: SearchFilters) => void;
  totalTransactions: number;
  totalAmount: number;
  showBalance?: boolean;
}

export const TransactionListHeader = ({
  displayCurrency,
  onCurrencyChange,
  searchFilters,
  onSearchFiltersChange,
  totalTransactions,
  totalAmount,
  showBalance = false,
}: TransactionListHeaderProps) => {
  return (
    <div className="border-b border-accent">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Recent Transactions</h3>
            {showBalance && (
              <p className="text-sm text-muted-foreground mt-1">
                Total: <span className={totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(totalAmount, displayCurrency)}
                </span>
              </p>
            )}
          </div>
          <CurrencySelector
            displayCurrency={displayCurrency}
            onCurrencyChange={onCurrencyChange}
            variant="compact"
          />
        </div>
        
        <TransactionSearch
          onFiltersChange={onSearchFiltersChange}
          totalResults={totalTransactions}
          initialFilters={searchFilters}
        />
      </div>
    </div>
  );
};
