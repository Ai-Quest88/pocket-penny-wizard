export interface TransactionData {
  date: string;
  description: string;
  amount: number;
  category?: string;
  comment?: string;
  currency?: string;
  asset_account_id?: string;
  liability_account_id?: string;
}

export interface CategoryDiscoveryResult {
  category: string;
  confidence: number;
  is_new_category: boolean;
  group_name?: string;
  source: 'user_rule' | 'system_rule' | 'ai' | 'fallback' | 'uncategorized';
}

export interface CategorizationRule {
  pattern: string;
  category: string;
  confidence: number;
}

export interface CategorizationStats {
  userRules: number;
  systemRules: number;
  aiCategorized: number;
  uncategorized: number;
  total: number;
}