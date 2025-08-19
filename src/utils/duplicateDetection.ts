import { supabase } from '@/integrations/supabase/client';

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  currency: string;
  category_id: string | null;
  asset_account_id: string | null;
  liability_account_id: string | null;
  comment: string | null;
  created_at: string | null;
  updated_at: string | null;
  assets?: { name: string } | null;
  liabilities?: { name: string } | null;
};

export interface DuplicateGroup {
  id: string;
  transactions: Transaction[];
  criteria: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DuplicateDetectionResult {
  duplicateGroups: DuplicateGroup[];
  totalDuplicates: number;
  potentialSavings: number;
}

/**
 * Normalizes text for comparison by removing extra spaces, special characters, and converting to lowercase
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates similarity between two strings using a simple algorithm
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  if (normalized1 === normalized2) return 1;
  
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  const allWords = new Set([...words1, ...words2]);
  
  let matches = 0;
  for (const word of allWords) {
    if (words1.includes(word) && words2.includes(word)) {
      matches++;
    }
  }
  
  return matches / allWords.size;
}

/**
 * Checks if two dates are within the specified number of days
 */
function datesWithinRange(date1: string, date2: string, dayRange: number = 3): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= dayRange;
}

/**
 * Detects duplicate transactions based on multiple criteria
 */
export function detectDuplicateTransactions(transactions: Transaction[]): DuplicateDetectionResult {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedTransactions = new Set<string>();
  let totalDuplicates = 0;
  let potentialSavings = 0;

  // Sort transactions by date (newest first) for better grouping
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (let i = 0; i < sortedTransactions.length; i++) {
    const currentTransaction = sortedTransactions[i];
    
    if (processedTransactions.has(currentTransaction.id)) {
      continue;
    }

    const duplicates: Transaction[] = [currentTransaction];
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let criteria = '';

    // Look for duplicates
    for (let j = i + 1; j < sortedTransactions.length; j++) {
      const compareTransaction = sortedTransactions[j];
      
      if (processedTransactions.has(compareTransaction.id)) {
        continue;
      }

      // Exact match criteria
      if (
        Math.abs(currentTransaction.amount) === Math.abs(compareTransaction.amount) &&
        currentTransaction.date === compareTransaction.date &&
        normalizeText(currentTransaction.description) === normalizeText(compareTransaction.description)
      ) {
        duplicates.push(compareTransaction);
        confidence = 'high';
        criteria = 'Exact match: same amount, date, and description';
      }
      // Near exact match (same amount, similar description, close dates)
      else if (
        Math.abs(currentTransaction.amount) === Math.abs(compareTransaction.amount) &&
        datesWithinRange(currentTransaction.date, compareTransaction.date, 1) &&
        calculateTextSimilarity(currentTransaction.description, compareTransaction.description) > 0.8
      ) {
        duplicates.push(compareTransaction);
        confidence = confidence === 'high' ? 'high' : 'medium';
        criteria = criteria || 'Near match: same amount, similar description, close dates';
      }
      // Amount and description match with wider date range
      else if (
        Math.abs(currentTransaction.amount) === Math.abs(compareTransaction.amount) &&
        datesWithinRange(currentTransaction.date, compareTransaction.date, 3) &&
        calculateTextSimilarity(currentTransaction.description, compareTransaction.description) > 0.9
      ) {
        duplicates.push(compareTransaction);
        confidence = confidence === 'high' ? 'high' : confidence === 'medium' ? 'medium' : 'low';
        criteria = criteria || 'Potential match: same amount, very similar description, within 3 days';
      }
    }

    // If we found duplicates, create a group
    if (duplicates.length > 1) {
      const groupId = `group-${currentTransaction.id}`;
      
      // Mark all transactions in this group as processed
      duplicates.forEach(transaction => {
        processedTransactions.add(transaction.id);
      });

      duplicateGroups.push({
        id: groupId,
        transactions: duplicates,
        criteria,
        confidence
      });

      // Calculate potential savings (duplicates beyond the first one)
      const duplicateAmount = duplicates.slice(1).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      potentialSavings += duplicateAmount;
      totalDuplicates += duplicates.length - 1;
    }
  }

  return {
    duplicateGroups,
    totalDuplicates,
    potentialSavings
  };
}

/**
 * Filters duplicate groups by confidence level
 */
export function filterDuplicatesByConfidence(
  result: DuplicateDetectionResult,
  minConfidence: 'low' | 'medium' | 'high' = 'low'
): DuplicateDetectionResult {
  const confidenceOrder = { low: 0, medium: 1, high: 2 };
  const minLevel = confidenceOrder[minConfidence];
  
  const filteredGroups = result.duplicateGroups.filter(
    group => confidenceOrder[group.confidence] >= minLevel
  );
  
  const totalDuplicates = filteredGroups.reduce((sum, group) => sum + group.transactions.length - 1, 0);
  const potentialSavings = filteredGroups.reduce((sum, group) => {
    return sum + group.transactions.slice(1).reduce((groupSum, t) => groupSum + Math.abs(t.amount), 0);
  }, 0);
  
  return {
    duplicateGroups: filteredGroups,
    totalDuplicates,
    potentialSavings
  };
}