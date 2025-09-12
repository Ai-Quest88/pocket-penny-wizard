import { useAuth } from '@/contexts/AuthContext';
import { TransactionProcessor } from './TransactionProcessor';

export { TransactionProcessor } from './TransactionProcessor';
export { TransactionCategorizer } from './TransactionCategorizer';
export type { TransactionData, CategoryDiscoveryResult, CategorizationStats } from './types';

// Hook for using the clean transaction processor
export const useTransactionProcessor = () => {
  const { session } = useAuth();
  
  if (!session) {
    throw new Error('User must be authenticated to use transaction processor');
  }
  
  return new TransactionProcessor(session.user.id);
};