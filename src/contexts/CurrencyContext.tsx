import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  getExchangeRates, 
  convertAmount, 
  formatCurrency, 
  CURRENCIES, 
  currencySymbols,
  ExchangeRates 
} from '@/utils/currencyUtils';

interface CurrencyContextType {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  exchangeRates: ExchangeRates | undefined;
  isRatesLoading: boolean;
  convertAmount: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  updateUserCurrencyPreference: (currency: string) => Promise<void>;
  availableCurrencies: typeof CURRENCIES;
  currencySymbols: typeof currencySymbols;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [displayCurrency, setDisplayCurrencyState] = useState<string>('AUD');

  // Load user's currency preference from profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('currency_preference')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching user profile:', error);
        }
        return null;
      }

      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Set display currency from user preference or localStorage, defaulting to AUD
  useEffect(() => {
    // Clear any existing USD preference and force AUD
    localStorage.removeItem('displayCurrency');
    localStorage.setItem('displayCurrency', 'AUD');
    
    if (userProfile?.currency_preference && userProfile.currency_preference !== 'USD') {
      setDisplayCurrencyState(userProfile.currency_preference);
    } else {
      // Force AUD and update user preference
      setDisplayCurrencyState('AUD');
      if (session?.user?.id) {
        updateUserCurrencyPreference('AUD').catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to update currency to AUD:', error);
          }
        });
      }
    }
  }, [userProfile, session]);

  // Fetch exchange rates
  const { data: exchangeRates, isLoading: isRatesLoading } = useQuery({
    queryKey: ['exchangeRates', displayCurrency],
    queryFn: () => getExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
    retry: 3,
  });

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency);
    localStorage.setItem('displayCurrency', currency);
    
    // Update user preference in database if logged in
    if (session?.user?.id) {
      updateUserCurrencyPreference(currency).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to update user currency preference:', error);
        }
      });
    }
  };

  const updateUserCurrencyPreference = async (currency: string): Promise<void> => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: session.user.id,
          email: session.user.email || '',
          currency_preference: currency,
        });

      if (error) throw error;

      // Invalidate user profile query to refresh
      queryClient.invalidateQueries({ queryKey: ['user-profile', session.user.id] });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating currency preference:', error);
      }
      throw error;
    }
  };

  const convertAmountHelper = (
    amount: number, 
    fromCurrency: string, 
    toCurrency: string = displayCurrency
  ): number => {
    if (!exchangeRates) return amount;
    return convertAmount(amount, fromCurrency, toCurrency, exchangeRates);
  };

  const formatCurrencyHelper = (
    amount: number, 
    currencyCode: string = displayCurrency
  ): string => {
    return formatCurrency(amount, currencyCode);
  };

  const contextValue: CurrencyContextType = {
    displayCurrency,
    setDisplayCurrency,
    exchangeRates,
    isRatesLoading,
    convertAmount: convertAmountHelper,
    formatCurrency: formatCurrencyHelper,
    updateUserCurrencyPreference,
    availableCurrencies: CURRENCIES,
    currencySymbols,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Hook for converting amounts with current display currency
export function useConvertAmount() {
  const { convertAmount, exchangeRates, displayCurrency } = useCurrency();
  
  return (amount: number, fromCurrency: string, toCurrency?: string) => {
    if (!exchangeRates) return amount;
    return convertAmount(amount, fromCurrency, toCurrency || displayCurrency);
  };
}

// Hook for formatting currency with current display currency
export function useFormatCurrency() {
  const { formatCurrency, displayCurrency } = useCurrency();
  
  return (amount: number, currencyCode?: string) => {
    return formatCurrency(amount, currencyCode || displayCurrency);
  };
} 