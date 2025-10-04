-- Update default currency to AUD for assets and liabilities
ALTER TABLE public.assets 
ALTER COLUMN currency SET DEFAULT 'AUD';

ALTER TABLE public.liabilities 
ALTER COLUMN currency SET DEFAULT 'AUD';

-- Ensure default country is Australia for both tables
ALTER TABLE public.assets 
ALTER COLUMN country SET DEFAULT 'Australia';

ALTER TABLE public.liabilities 
ALTER COLUMN country SET DEFAULT 'Australia';

-- Update any existing records that have USD currency to AUD (optional - only if you want to update existing data)
-- UPDATE public.assets SET currency = 'AUD' WHERE currency = 'USD';
-- UPDATE public.liabilities SET currency = 'AUD' WHERE currency = 'USD';