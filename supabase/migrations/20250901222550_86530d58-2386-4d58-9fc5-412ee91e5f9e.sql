-- Fix the transaction account reference issue
-- First, let's check the constraint and make account_id nullable since we have asset_account_id and liability_account_id

-- Drop the existing foreign key constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Make account_id nullable since we have separate asset_account_id and liability_account_id
ALTER TABLE transactions ALTER COLUMN account_id DROP NOT NULL;

-- Add foreign key constraints for asset and liability accounts
ALTER TABLE transactions 
ADD CONSTRAINT transactions_asset_account_id_fkey 
FOREIGN KEY (asset_account_id) REFERENCES assets(id);

ALTER TABLE transactions 
ADD CONSTRAINT transactions_liability_account_id_fkey 
FOREIGN KEY (liability_account_id) REFERENCES liabilities(id);

-- Add a check constraint to ensure at least one account type is specified
ALTER TABLE transactions 
ADD CONSTRAINT transactions_account_check 
CHECK (
  account_id IS NOT NULL OR 
  asset_account_id IS NOT NULL OR 
  liability_account_id IS NOT NULL
);