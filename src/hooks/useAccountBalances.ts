
import { useQuery } from "@tanstack/react-query";
import { calculateAccountBalances } from "@/utils/balanceCalculations";
import { useAuth } from "@/contexts/AuthContext";

export const useAccountBalances = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['account-balances', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];
      return calculateAccountBalances(session.user.id);
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
