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

interface DuplicateGroup {
  transactions: (TransactionData & { originalIndex: number })[];
  key: string;
}

interface ProcessResult {
  inserted: number;
  duplicates: number;
  potentialDuplicates?: DuplicateGroup[];
  needsUserReview?: boolean;
}

export const insertTransactionsWithDuplicateCheck = async (
  transactions: TransactionData[],
  userApprovedDuplicates?: number[] // Indices of transactions user wants to keep despite being duplicates
): Promise<ProcessResult> => {
  let insertedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  console.log(`🔍 Starting duplicate check for ${transactions.length} transactions`);
  console.log(`📋 Sample transaction:`, transactions[0]);

  // Step 1: Find potential duplicates within the CSV batch
  const potentialDuplicates: DuplicateGroup[] = [];
  const processedTransactions: TransactionData[] = [];
  const duplicateMap = new Map<string, (TransactionData & { originalIndex: number })[]>();
  
  // Group transactions by potential duplicate key
  transactions.forEach((txn, index) => {
    const key = `${txn.date}|${txn.description}|${txn.amount}|${txn.user_id}`;
    
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, []);
    }
    duplicateMap.get(key)!.push({ ...txn, originalIndex: index });
  });

  // Identify groups with multiple transactions (potential duplicates)
  duplicateMap.forEach((group, key) => {
    if (group.length > 1) {
      potentialDuplicates.push({ transactions: group, key });
      console.log(`🔍 POTENTIAL DUPLICATES FOUND: ${group.length} transactions with key: ${key}`);
      group.forEach((txn, i) => {
        console.log(`  ${i + 1}. Line ${txn.originalIndex + 1}: "${txn.description}" - $${txn.amount} on ${txn.date}`);
      });
    } else {
      // Single transaction, add to process list
      processedTransactions.push(group[0]);
    }
  });

  // If we found potential duplicates and user hasn't reviewed them yet, return for user review
  if (potentialDuplicates.length > 0 && !userApprovedDuplicates) {
    console.log(`⏸️ Found ${potentialDuplicates.length} groups of potential duplicates. Requesting user review.`);
    return {
      inserted: 0,
      duplicates: 0,
      potentialDuplicates,
      needsUserReview: true
    };
  }

  // If user has reviewed duplicates, process their decisions
  if (userApprovedDuplicates && potentialDuplicates.length > 0) {
    potentialDuplicates.forEach(group => {
      group.transactions.forEach((txn, index) => {
        if (index === 0 || userApprovedDuplicates.includes(txn.originalIndex)) {
          // Keep first transaction of each group, plus any user-approved duplicates
          processedTransactions.push(txn);
          console.log(`✅ USER APPROVED: "${txn.description}" - $${txn.amount} on ${txn.date}`);
        } else {
          duplicateCount++;
          console.log(`🔄 USER REJECTED DUPLICATE: "${txn.description}" - $${txn.amount} on ${txn.date}`);
        }
      });
    });
  }

  console.log(`📋 After duplicate review: ${processedTransactions.length} transactions to process`);

  // Step 2: Check remaining transactions against database
  const batchSize = 10;
  const transactionsToInsert: any[] = [];
  
  for (let i = 0; i < processedTransactions.length; i += batchSize) {
    const batch = processedTransactions.slice(i, i + batchSize);
    
    // Check for exact duplicates in database
    const duplicateCheckPromises = batch.map(async (transaction) => {
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
        return { transaction, isDuplicate: true, reason: 'database_match' };
      }

      return { transaction, isDuplicate: false, reason: 'unique' };
    });

    const duplicateResults = await Promise.all(duplicateCheckPromises);

    // Collect non-duplicates for bulk insert
    for (const result of duplicateResults) {
      if (result.isDuplicate) {
        console.log(`🔄 DATABASE DUPLICATE SKIPPED (${result.reason}): "${result.transaction.description}" - $${result.transaction.amount} on ${result.transaction.date}`);
        duplicateCount++;
      } else {
        console.log(`✅ PREPARED FOR BULK INSERT: "${result.transaction.description}" - $${result.transaction.amount} on ${result.transaction.date}`);
        transactionsToInsert.push({
          user_id: result.transaction.user_id,
          description: result.transaction.description,
          amount: result.transaction.amount,
          date: result.transaction.date,
          currency: result.transaction.currency,
          category: result.transaction.category,
          asset_account_id: result.transaction.asset_account_id,
          liability_account_id: result.transaction.liability_account_id,
        });
      }
    }
  }

  // Bulk insert all valid transactions at once
  if (transactionsToInsert.length > 0) {
    console.log(`💾 BULK INSERTING ${transactionsToInsert.length} transactions...`);
    const bulkStartTime = Date.now();
    
    const { data: insertedData, error: bulkInsertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select('id');

    const bulkTime = Date.now() - bulkStartTime;
    
    if (bulkInsertError) {
      console.error(`❌ BULK INSERT ERROR:`, bulkInsertError);
      errorCount = transactionsToInsert.length;
    } else {
      insertedCount = insertedData?.length || transactionsToInsert.length;
      console.log(`✅ BULK INSERT SUCCESS: ${insertedCount} transactions inserted in ${bulkTime}ms`);
      console.log(`📊 Bulk insert performance: ${(insertedCount / bulkTime * 1000).toFixed(1)} transactions/second`);
    }
  } else {
    console.log(`ℹ️ No transactions to insert (all were duplicates or errors)`);
  }

  console.log(`📊 FINAL SUMMARY:`);
  console.log(`  📤 Total transactions processed: ${transactions.length}`);
  console.log(`  ✅ Successfully inserted: ${insertedCount}`);
  console.log(`  🔄 Total duplicates skipped: ${duplicateCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  🧮 Accounted for: ${insertedCount + duplicateCount + errorCount}/${transactions.length}`);
  console.log(`  📈 Success rate: ${((insertedCount / transactions.length) * 100).toFixed(1)}%`);
  
  if (insertedCount + duplicateCount + errorCount !== transactions.length) {
    console.warn(`⚠️ MISMATCH: ${transactions.length - (insertedCount + duplicateCount + errorCount)} transactions unaccounted for!`);
  }
  
  return { inserted: insertedCount, duplicates: duplicateCount };
};