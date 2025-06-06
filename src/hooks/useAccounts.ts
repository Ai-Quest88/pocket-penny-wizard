
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Account {
  id: string;
  name: string;
  type: string;
}

export const useAccounts = () => {
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('type', 'cash')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cash accounts:', error);
        throw error;
      }

      // Transform cash assets into account format
      return data.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      })) as Account[];
    },
  });

  return { accounts, isLoading };
};
