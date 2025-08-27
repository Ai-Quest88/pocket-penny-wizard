/**
 * @deprecated This file is deprecated. Use categoryUtils instead for new implementations.
 * Keeping only for backward compatibility.
 */

import { 
  categorizeTransaction as categorizeTransactionUtil,
  categorizeTransactionSync as categorizeTransactionSyncUtil,
  categorizeByBuiltInRules as categorizeByBuiltInRulesUtil,
  findSimilarTransactionCategory as findSimilarTransactionCategoryUtil
} from "./categoryUtils";

/**
 * @deprecated Use categorizeByBuiltInRules from categoryUtils instead
 */
export function categorizeByBuiltInRules(description: string, amount?: number): string | null {
  return categorizeByBuiltInRulesUtil(description);
}

/**
 * @deprecated Use categorizeTransaction from categoryUtils instead
 */
export async function categorizeTransaction(
  description: string, 
  userId?: string, 
  amount?: number
): Promise<string> {
  return categorizeTransactionUtil(description, userId, amount);
}

/**
 * @deprecated Use categorizeTransactionSync from categoryUtils instead
 */
export function categorizeTransactionSync(description: string, amount?: number): string {
  return categorizeTransactionSyncUtil(description, amount);
}

// Legacy exports for backward compatibility
export const addUserCategoryRule = () => {};
export const getUserCategoryRules = () => [];
export const clearUserCategoryRules = () => {};