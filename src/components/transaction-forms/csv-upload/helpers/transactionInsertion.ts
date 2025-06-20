
import { supabase } from "@/integrations/supabase/client";

interface TransactionData {
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  asset_account_id?: string | null;
  liability_account_id?: string | null;
  user_id: string;
}

export const insertTransactionsWithDuplicateCheck = async (
  transactions: TransactionData[]
): Promise<{ inserted: number; duplicates: number }> => {
  let insertedCount = 0;
  let duplicateCount = 0;

  console.log(`Checking for duplicates among ${transactions.length} transactions`);

  // Process transactions in smaller batches for better performance
  const batchSize = 10;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    // Build a more comprehensive duplicate check query
    const duplicateCheckPromises = batch.map(async (transaction) => {
      // Normalize description for better duplicate detection
      const normalizedDescription = transaction.description.trim().toLowerCase();
      
      // Check for exact matches first
      const { data: exactMatches, error: exactError } = await supabase
        .from('transactions')
        .select('id, description, amount, date')
        .eq('user_id', transaction.user_id)
        .eq('description', transaction.description)
        .eq('amount', transaction.amount)
        .eq('date', transaction.date);

      if (exactError) {
        console.error('Error checking for exact duplicate:', exactError);
        return { transaction, isDuplicate: false, reason: 'error' };
      }

      if (exactMatches && exactMatches.length > 0) {
        return { transaction, isDuplicate: true, reason: 'exact_match' };
      }

      // Check for near-duplicates (same amount and date, similar description)
      const { data: similarMatches, error: similarError } = await supabase
        .from('transactions')
        .select('id, description, amount, date')
        .eq('user_id', transaction.user_id)
        .eq('amount', transaction.amount)
        .eq('date', transaction.date)
        .ilike('description', `%${normalizedDescription.substring(0, 20)}%`);

      if (similarError) {
        console.error('Error checking for similar duplicate:', similarError);
        return { transaction, isDuplicate: false, reason: 'error' };
      }

      // Consider it a duplicate if we find a very similar transaction on the same date with same amount
      if (similarMatches && similarMatches.length > 0) {
        const isSimilar = similarMatches.some(match => {
          const similarity = calculateStringSimilarity(
            normalizedDescription,
            match.description.trim().toLowerCase()
          );
          return similarity > 0.8; // 80% similarity threshold
        });
        
        if (isSimilar) {
          return { transaction, isDuplicate: true, reason: 'similar_match' };
        }
      }

      return { transaction, isDuplicate: false, reason: 'unique' };
    });

    const duplicateResults = await Promise.all(duplicateCheckPromises);

    // Process results and insert non-duplicates
    for (const result of duplicateResults) {
      if (result.isDuplicate) {
        console.log(`Duplicate found (${result.reason}): ${result.transaction.description} - ${result.transaction.amount} on ${result.transaction.date}`);
        duplicateCount++;
      } else {
        // Insert the transaction with the new column structure
        const { error: insertError } = await supabase
          .from('transactions')
          .insert([{
            user_id: result.transaction.user_id,
            description: result.transaction.description,
            amount: result.transaction.amount,
            date: result.transaction.date,
            currency: result.transaction.currency,
            category: result.transaction.category,
            asset_account_id: result.transaction.asset_account_id,
            liability_account_id: result.transaction.liability_account_id,
          }]);

        if (insertError) {
          console.error('Error inserting transaction:', insertError);
        } else {
          insertedCount++;
        }
      }
    }
  }

  console.log(`Insert summary: ${insertedCount} inserted, ${duplicateCount} duplicates skipped`);
  return { inserted: insertedCount, duplicates: duplicateCount };
};

// Helper function to calculate string similarity using Levenshtein distance
function calculateStringSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}
