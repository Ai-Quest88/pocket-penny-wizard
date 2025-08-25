-- Add missing columns to assets table
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS opening_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_balance_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS address text;

-- Update the assets table to use the new structure
-- Rename current_value to value if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'value') THEN
        ALTER TABLE public.assets RENAME COLUMN current_value TO value;
    END IF;
END $$;

-- Add missing columns to liabilities table  
ALTER TABLE public.liabilities 
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS opening_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS opening_balance_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS credit_limit numeric,
ADD COLUMN IF NOT EXISTS monthly_payment numeric;

-- Update the liabilities table to use the new structure
-- Rename current_balance to amount if needed
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'liabilities' AND column_name = 'amount') THEN
        ALTER TABLE public.liabilities RENAME COLUMN current_balance TO amount;
    END IF;
END $$;

-- Add missing columns to entities table that the code expects
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS country_of_residence text DEFAULT 'Australia',
ADD COLUMN IF NOT EXISTS date_added timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS incorporation_date date,
ADD COLUMN IF NOT EXISTS description text;

-- Update existing entities to have a default country if null
UPDATE public.entities 
SET country_of_residence = 'Australia' 
WHERE country_of_residence IS NULL;