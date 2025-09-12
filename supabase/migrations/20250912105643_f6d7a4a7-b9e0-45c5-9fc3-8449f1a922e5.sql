-- Add categorization source column to transactions table
ALTER TABLE transactions 
ADD COLUMN categorization_source TEXT 
CHECK (categorization_source IN ('user_rule', 'system_rule', 'ai', 'fallback', 'manual', 'uncategorized'))
DEFAULT 'manual';