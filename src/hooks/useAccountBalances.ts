import { useQuery } from "@tanstack/react-query";
import { calculateAccountBalances } from "@/utils/balanceCalculations";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

export const useAccountBalances = () => {
  const { session } = useAuth();
  const { displayCurrency, convertAmount, exchangeRates } = useCurrency();

  return useQuery({
    queryKey: ['account-balances', session?.user?.id, displayCurrency, exchangeRates],
    queryFn: async () => {
      if (!session?.user) return [];
      const balances = await calculateAccountBalances(session.user.id);
      
      // Convert all balances to display currency
      // Assuming assets/liabilities are stored in AUD as default
      const DEFAULT_ASSET_LIABILITY_CURRENCY = 'AUD';
      
      return balances.map(balance => ({
        ...balance,
        openingBalance: convertAmount(
          balance.openingBalance, 
          DEFAULT_ASSET_LIABILITY_CURRENCY, 
          displayCurrency
        ),
        transactionSum: convertAmount(
          balance.transactionSum, 
          DEFAULT_ASSET_LIABILITY_CURRENCY, 
          displayCurrency
        ),
        calculatedBalance: convertAmount(
          balance.calculatedBalance, 
          DEFAULT_ASSET_LIABILITY_CURRENCY, 
          displayCurrency
        ),
      }));
    },
    enabled: !!session?.user && !!exchangeRates,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
