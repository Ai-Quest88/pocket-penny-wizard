
-- Remove the existing foreign key constraint that only allows linking to assets
ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Add separate optional foreign key columns for assets and liabilities
ALTER TABLE public.transactions 
ADD COLUMN asset_account_id uuid REFERENCES public.assets(id),
ADD COLUMN liability_account_id uuid REFERENCES public.liabilities(id);

-- Migrate existing data: move account_id values to asset_account_id 
-- (since the current constraint only allowed assets)
UPDATE public.transactions 
SET asset_account_id = account_id 
WHERE account_id IS NOT NULL;

-- Add a check constraint to ensure only one account type is set
ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_single_account_check 
CHECK (
  (asset_account_id IS NOT NULL AND liability_account_id IS NULL) OR
  (asset_account_id IS NULL AND liability_account_id IS NOT NULL) OR
  (asset_account_id IS NULL AND liability_account_id IS NULL)
);

-- Drop the old account_id column since we now have specific columns
ALTER TABLE public.transactions 
DROP COLUMN account_id;

-- Create indexes for better performance
CREATE INDEX idx_transactions_asset_account_id ON public.transactions(asset_account_id);
CREATE INDEX idx_transactions_liability_account_id ON public.transactions(liability_account_id);
