export interface ExchangeRates {
  [key: string]: number;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag?: string;
}

export const CURRENCIES: Currency[] = [
  { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", flag: "🇸🇪" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", flag: "🇳🇴" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", flag: "🇩🇰" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "KRW", symbol: "₩", name: "South Korean Won", flag: "🇰🇷" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", flag: "🇧🇷" },
  { code: "MXN", symbol: "$", name: "Mexican Peso", flag: "🇲🇽" },
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦" },
  { code: "THB", symbol: "฿", name: "Thai Baht", flag: "🇹🇭" },
];

// Create a symbol map for easy lookup
export const currencySymbols: Record<string, string> = CURRENCIES.reduce((acc, currency) => {
  acc[currency.code] = currency.symbol;
  return acc;
}, {} as Record<string, string>);

// Fallback exchange rates (approximate, for offline usage)
const fallbackRates: ExchangeRates = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  AUD: 1.35,
  CAD: 1.25,
  CHF: 0.92,
  CNY: 6.45,
  SEK: 8.50,
  NZD: 1.42,
  NOK: 8.60,
  DKK: 6.35,
  SGD: 1.35,
  HKD: 7.80,
  INR: 74.0,
  KRW: 1180.0,
  BRL: 5.20,
  MXN: 20.0,
  ZAR: 14.5,
  THB: 33.0,
};

export const getExchangeRates = async (baseCurrency: string = "AUD"): Promise<ExchangeRates> => {
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${baseCurrency}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.rates) {
      throw new Error("Invalid response format");
    }
    
    // Cache the rates with timestamp
    const ratesWithTimestamp = {
      ...data.rates,
      _timestamp: Date.now(),
      _baseCurrency: baseCurrency
    };
    
    localStorage.setItem('exchangeRates', JSON.stringify(ratesWithTimestamp));
    
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    
    // Try to use cached rates first
    const cachedRates = getCachedExchangeRates();
    if (cachedRates && isRatesCacheValid(cachedRates)) {
      console.log("Using cached exchange rates");
      return cachedRates;
    }
    
    // Fall back to approximate rates
    console.log("Using fallback exchange rates");
    return convertToBaseCurrency(fallbackRates, baseCurrency);
  }
};

export const getCachedExchangeRates = (): ExchangeRates | null => {
  try {
    const cached = localStorage.getItem('exchangeRates');
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return data;
  } catch (error) {
    console.error("Error reading cached rates:", error);
    return null;
  }
};

export const isRatesCacheValid = (rates: Record<string, any>): boolean => {
  const timestamp = rates._timestamp;
  if (!timestamp) return false;
  
  // Cache is valid for 1 hour
  const cacheAge = Date.now() - timestamp;
  return cacheAge < 60 * 60 * 1000;
};

export const convertToBaseCurrency = (rates: ExchangeRates, targetBase: string): ExchangeRates => {
  if (targetBase === "USD") return rates;
  
  const baseRate = rates[targetBase];
  if (!baseRate) return rates;
  
  const convertedRates: ExchangeRates = {};
  Object.entries(rates).forEach(([currency, rate]) => {
    convertedRates[currency] = rate / baseRate;
  });
  
  return convertedRates;
};

export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates | { rates: ExchangeRates; base: string; timestamp: number }
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Handle both formats: direct rates object or wrapped rates object
  const actualRates = 'rates' in rates ? rates.rates : rates;
  const baseCurrency = 'base' in rates ? rates.base : 'USD';
  
  // Handle base currency (rate is 1.0)
  const fromRate = fromCurrency === baseCurrency ? 1.0 : actualRates[fromCurrency];
  const toRate = toCurrency === baseCurrency ? 1.0 : actualRates[toCurrency];
  
  if (!fromRate || !toRate) {
    console.warn(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
    return 0;
  }
  
  // Convert to base currency first, then to target currency
  const amountInBase = amount / fromRate;
  const convertedAmount = amountInBase * toRate;
  
  return convertedAmount;
};

export const formatCurrency = (
  amount: number,
  currencyCode: string,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    precision?: number;
  } = {}
): string => {
  const { showSymbol = true, showCode = false, precision = 2 } = options;
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  // Format the number with commas for thousands separators
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  
  const sign = amount < 0 ? "-" : "";
  
  let result = `${sign}${showSymbol ? symbol : ""}${formattedAmount}`;
  
  if (showCode) {
    result += ` ${currencyCode}`;
  }
  
  return result;
};

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const getPopularCurrencies = (): Currency[] => {
  const popularCodes = ["AUD", "USD", "EUR", "GBP", "JPY", "CAD", "CHF", "CNY"];
  return CURRENCIES.filter(c => popularCodes.includes(c.code));
};
