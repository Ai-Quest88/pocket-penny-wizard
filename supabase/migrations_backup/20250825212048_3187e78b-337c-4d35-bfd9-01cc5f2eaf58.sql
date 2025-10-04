-- Add country field to liabilities table (missing from current schema)
ALTER TABLE public.liabilities 
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';

-- Add country field to assets table (currently has location field but types expect country)
ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Australia';

-- Update existing records to use location as country for assets where country is null
UPDATE public.assets 
SET country = COALESCE(location, 'Australia') 
WHERE country IS NULL;