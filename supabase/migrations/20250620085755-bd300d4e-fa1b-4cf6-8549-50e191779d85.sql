
-- Add opening balance and opening balance date fields to assets table
ALTER TABLE public.assets 
ADD COLUMN opening_balance numeric DEFAULT 0,
ADD COLUMN opening_balance_date date DEFAULT CURRENT_DATE;

-- Add opening balance and opening balance date fields to liabilities table  
ALTER TABLE public.liabilities
ADD COLUMN opening_balance numeric DEFAULT 0,
ADD COLUMN opening_balance_date date DEFAULT CURRENT_DATE;

-- Update existing assets to set opening_balance to current value and opening_balance_date to created_at date
UPDATE public.assets 
SET opening_balance = value, 
    opening_balance_date = created_at::date
WHERE opening_balance IS NULL;

-- Update existing liabilities to set opening_balance to current amount and opening_balance_date to created_at date
UPDATE public.liabilities 
SET opening_balance = amount, 
    opening_balance_date = created_at::date  
WHERE opening_balance IS NULL;

-- Make the fields NOT NULL after setting default values
ALTER TABLE public.assets 
ALTER COLUMN opening_balance SET NOT NULL,
ALTER COLUMN opening_balance_date SET NOT NULL;

ALTER TABLE public.liabilities
ALTER COLUMN opening_balance SET NOT NULL,
ALTER COLUMN opening_balance_date SET NOT NULL;
