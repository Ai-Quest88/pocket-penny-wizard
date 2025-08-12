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
      
      // Convert all balances from their original currency to display currency
      console.log(`🔄 Converting balances to display currency: ${displayCurrency}`);
      return balances.map(balance => {
        console.log(`  - Account ${balance.accountName}:`);
        console.log(`    Original currency: ${balance.currency}`);
        console.log(`    Opening balance before conversion: ${balance.openingBalance}`);
        
        const convertedBalance = {
          ...balance,
          openingBalance: convertAmount(
            balance.openingBalance, 
            balance.currency, 
            displayCurrency
          ),
          transactionSum: convertAmount(
            balance.transactionSum, 
            balance.currency, 
            displayCurrency
          ),
          calculatedBalance: convertAmount(
            balance.calculatedBalance, 
            balance.currency, 
            displayCurrency
          ),
        };
        
        console.log(`    Opening balance after conversion: ${convertedBalance.openingBalance}`);
        console.log(`    Calculated balance after conversion: ${convertedBalance.calculatedBalance}`);
        
        return convertedBalance;
      });
    },
    enabled: !!session?.user && !!exchangeRates,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
