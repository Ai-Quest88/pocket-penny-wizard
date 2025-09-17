import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, getPopularCurrencies, Currency } from "@/utils/currencyUtils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CurrencySelectorProps {
  displayCurrency: string;
  onCurrencyChange: (currency: string) => void;
  showPopularFirst?: boolean;
  variant?: "compact" | "full";
}

export const CurrencySelector = ({
  displayCurrency,
  onCurrencyChange,
  showPopularFirst = true,
  variant = "compact",
}: CurrencySelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCurrencies = CURRENCIES.filter(currency =>
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const popularCurrencies = showPopularFirst ? getPopularCurrencies() : [];
  const otherCurrencies = showPopularFirst 
    ? filteredCurrencies.filter(c => !popularCurrencies.find(p => p.code === c.code))
    : filteredCurrencies;

  const selectedCurrency = CURRENCIES.find(c => c.code === displayCurrency);

  if (variant === "compact") {
    return (
      <div className="w-36">
        <Select value={displayCurrency} onValueChange={onCurrencyChange}>
          <SelectTrigger>
            <SelectValue>
              {selectedCurrency && (
                <div className="flex items-center gap-2">
                  <span>{selectedCurrency.flag}</span>
                  <span className="font-medium">{selectedCurrency.code}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-80">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search currencies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            {showPopularFirst && searchTerm === "" && (
              <>
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Popular</p>
                </div>
                {popularCurrencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-lg">{currency.flag}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{currency.name}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                
                {otherCurrencies.length > 0 && (
                  <div className="px-2 py-1 mt-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All Currencies</p>
                  </div>
                )}
              </>
            )}
            
            {(searchTerm !== "" ? filteredCurrencies : otherCurrencies).map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                <div className="flex items-center gap-3 w-full">
                  <span className="text-lg">{currency.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{currency.name}</p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Full variant with more detailed display
  return (
    <div className="w-full max-w-sm">
      <Select value={displayCurrency} onValueChange={onCurrencyChange}>
        <SelectTrigger className="h-12">
          <SelectValue>
            {selectedCurrency && (
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedCurrency.flag}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{selectedCurrency.code}</span>
                    <span className="text-muted-foreground">{selectedCurrency.symbol}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">{selectedCurrency.name}</p>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-80">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          {showPopularFirst && searchTerm === "" && (
            <>
              <div className="px-2 py-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Popular</p>
              </div>
              {popularCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-xl">{currency.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{currency.code}</span>
                        <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{currency.name}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
              
              {otherCurrencies.length > 0 && (
                <div className="px-2 py-1 mt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">All Currencies</p>
                </div>
              )}
            </>
          )}
          
          {(searchTerm !== "" ? filteredCurrencies : otherCurrencies).map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-3 w-full">
                <span className="text-xl">{currency.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{currency.code}</span>
                    <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{currency.name}</p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
