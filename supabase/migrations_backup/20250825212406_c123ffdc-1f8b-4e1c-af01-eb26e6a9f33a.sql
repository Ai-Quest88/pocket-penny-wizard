-- Update default currency to AUD across all tables
ALTER TABLE public.accounts 
ALTER COLUMN currency SET DEFAULT 'AUD';

ALTER TABLE public.budgets 
ALTER COLUMN currency SET DEFAULT 'AUD';

ALTER TABLE public.transactions 
ALTER COLUMN currency SET DEFAULT 'AUD';

ALTER TABLE public.user_profiles 
ALTER COLUMN currency_preference SET DEFAULT 'AUD';

-- Entities table already has Australia as default for country_of_residence
-- No need to change entities table as it already defaults to 'Australia'