-- Add missing columns that the application expects

-- Add currency_preference to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS currency_preference text DEFAULT 'USD';

-- Add category and sort_order columns to categories
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add category columns to assets and liabilities
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS category text;

ALTER TABLE public.liabilities 
ADD COLUMN IF NOT EXISTS category text;

-- Add account relationship columns to transactions for assets/liabilities
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS asset_account_id uuid,
ADD COLUMN IF NOT EXISTS liability_account_id uuid;

-- Add foreign key constraints for the new relationship columns
ALTER TABLE public.transactions 
ADD CONSTRAINT fk_transactions_asset_account 
FOREIGN KEY (asset_account_id) REFERENCES public.assets(id) ON DELETE SET NULL;

ALTER TABLE public.transactions 
ADD CONSTRAINT fk_transactions_liability_account 
FOREIGN KEY (liability_account_id) REFERENCES public.liabilities(id) ON DELETE SET NULL;

-- Update existing categories to have proper sort_order
UPDATE public.categories 
SET sort_order = 
  CASE 
    WHEN type = 'income' THEN 1
    WHEN type = 'expense' THEN 2
    WHEN type = 'transfer' THEN 3
    ELSE 0
  END
WHERE sort_order IS NULL OR sort_order = 0;