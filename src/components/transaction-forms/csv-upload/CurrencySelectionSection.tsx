import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import { DollarSign } from "lucide-react";

interface CurrencySelectionSectionProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export const CurrencySelectionSection = ({ 
  selectedCurrency, 
  onCurrencyChange 
}: CurrencySelectionSectionProps) => {
  const { availableCurrencies, currencySymbols } = useCurrency();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="currency-select" className="text-base font-medium">
          Default Currency
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          All imported transactions will use this currency unless your CSV file includes a currency column
        </p>
      </div>
      
      <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="w-full h-auto min-h-[40px]">
          <div className="flex items-center gap-2 py-1">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedCurrency}</span>
              <span className="text-muted-foreground">
                ({currencySymbols[selectedCurrency as keyof typeof currencySymbols]})
              </span>
              <span className="text-sm text-muted-foreground">
                {availableCurrencies.find(c => c.code === selectedCurrency)?.name}
              </span>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[var(--radix-select-trigger-width)] bg-background border shadow-lg z-[100]">
          {availableCurrencies.map((currency) => (
            <SelectItem 
              key={currency.code} 
              value={currency.code}
              className="py-3"
            >
              <div className="flex items-center gap-3 w-full">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-muted-foreground">
                    ({currencySymbols[currency.code as keyof typeof currencySymbols]})
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {currency.name}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 Tip: If your CSV has a currency column, map it in the Column Mapping section below to override this default
        </p>
      </div>
    </div>
  );
};
