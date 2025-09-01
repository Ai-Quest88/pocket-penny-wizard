-- Remove the redundant account_id column since we now use asset_account_id and liability_account_id

-- First drop the check constraint that references account_id
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_check;

-- Drop the account_id column entirely
ALTER TABLE transactions DROP COLUMN IF EXISTS account_id;

-- Add a simpler check constraint to ensure at least one account type is specified
ALTER TABLE transactions 
ADD CONSTRAINT transactions_account_check 
CHECK (
  asset_account_id IS NOT NULL OR 
  liability_account_id IS NOT NULL
);