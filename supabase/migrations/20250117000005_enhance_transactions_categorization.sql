-- Enhance transactions table with categorization metadata for Smart Categorization System
-- Add columns to track categorization source, confidence, and reasoning

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS categorization_source VARCHAR(50) DEFAULT 'ai';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS categorization_confidence DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS categorization_reasoning TEXT;

-- Create indexes for performance on categorization columns
CREATE INDEX IF NOT EXISTS idx_transactions_categorization_source ON transactions 
(categorization_source) WHERE categorization_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_categorization_confidence ON transactions 
(categorization_confidence) WHERE categorization_confidence IS NOT NULL;

-- Create composite index for user history lookups (used by UserHistoryMatcher)
CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date ON transactions 
(user_id, category_id, date DESC) WHERE category_id IS NOT NULL;

-- Create index for description similarity searches
CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions 
(description) WHERE description IS NOT NULL;
