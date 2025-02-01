export interface ExchangeRates {
  [key: string]: number;
}

export const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${baseCurrency}`
    );
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    throw new Error("Failed to fetch exchange rates");
  }
};

export const convertAmount = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return amount;
  if (!rates[fromCurrency] || !rates[toCurrency]) return amount;
  
  // Convert to USD first (base currency), then to target currency
  const amountInUSD = amount / rates[fromCurrency];
  return amountInUSD * rates[toCurrency];
};