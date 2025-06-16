
import { supabase } from "@/integrations/supabase/client";

interface TransactionData {
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  account_id?: string;
  user_id: string;
}

export const insertTransactionsWithDuplicateCheck = async (
  transactions: TransactionData[]
): Promise<{ inserted: number; duplicates: number }> => {
  let insertedCount = 0;
  let duplicateCount = 0;

  console.log(`Checking for duplicates among ${transactions.length} transactions`);

  for (const transaction of transactions) {
    // Check if transaction already exists based on description, amount, date, and user_id
    const { data: existingTransactions, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', transaction.user_id)
      .eq('description', transaction.description)
      .eq('amount', transaction.amount)
      .eq('date', transaction.date);

    if (checkError) {
      console.error('Error checking for duplicate transaction:', checkError);
      continue;
    }

    if (existingTransactions && existingTransactions.length > 0) {
      console.log(`Duplicate found: ${transaction.description} - ${transaction.amount} on ${transaction.date}`);
      duplicateCount++;
      continue;
    }

    // Insert the transaction if no duplicate found
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([transaction]);

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
    } else {
      insertedCount++;
    }
  }

  console.log(`Insert summary: ${insertedCount} inserted, ${duplicateCount} duplicates skipped`);
  return { inserted: insertedCount, duplicates: duplicateCount };
};
