
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Account {
  id: string;
  name: string;
  type: string;
  entityName?: string;
  entityType?: string;
  accountNumber?: string;
}

export const useAccounts = () => {
  const { session } = useAuth();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          entity_id,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .eq('type', 'cash')
        .order('name');

      if (error) {
        console.error('Error fetching cash accounts:', error);
        throw error;
      }

      // Transform cash assets into account format with entity information
      return data.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        entityName: asset.entities.name,
        entityType: asset.entities.type,
        accountNumber: asset.account_number
      })) as Account[];
    },
    enabled: !!session?.user,
  });

  return { accounts, isLoading };
};
