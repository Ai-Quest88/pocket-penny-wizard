
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CurrencySelectorProps {
  displayCurrency: string;
  onCurrencyChange: (currency: string) => void;
  currencySymbols: Record<string, string>;
}

export const CurrencySelector = ({
  displayCurrency,
  onCurrencyChange,
  currencySymbols,
}: CurrencySelectorProps) => {
  return (
    <div className="w-32">
      <Select
        value={displayCurrency}
        onValueChange={onCurrencyChange}
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
  );
};
