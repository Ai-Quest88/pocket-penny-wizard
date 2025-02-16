
import { supabase } from "@/integrations/supabase/client";

export async function linkYodleeAccount(accountData: {
  id: string;
  accountName: string;
  accountType: string;
  providerName: string;
}) {
  const { data, error } = await supabase.functions.invoke('yodlee', {
    body: {
      action: 'linkAccount',
      accountData
    }
  });

  if (error) throw error;
  return data;
}

export async function syncTransactions(accountId: string) {
  const { data, error } = await supabase.functions.invoke('yodlee', {
    body: {
      action: 'syncTransactions',
      accountData: { accountId }
    }
  });

  if (error) throw error;
  return data;
}
