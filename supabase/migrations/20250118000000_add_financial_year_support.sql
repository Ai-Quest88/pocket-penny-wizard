-- Migration: Add Financial Year Support
-- This migration updates the schema to support computed financial years and multi-country accounts

-- Add primary country and currency to entities table
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS primary_country TEXT NOT NULL DEFAULT 'AU',
ADD COLUMN IF NOT EXISTS primary_currency TEXT NOT NULL DEFAULT 'AUD';

-- Update existing entities to have default values
UPDATE entities 
SET primary_country = country_of_residence,
    primary_currency = CASE 
        WHEN country_of_residence = 'AU' THEN 'AUD'
        WHEN country_of_residence = 'IN' THEN 'INR'
        WHEN country_of_residence = 'UK' THEN 'GBP'
        WHEN country_of_residence = 'CA' THEN 'CAD'
        WHEN country_of_residence = 'EU' THEN 'EUR'
        ELSE 'USD'
    END
WHERE primary_country IS NULL OR primary_currency IS NULL;

-- Add country and currency to assets table (for account-level country/currency)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT;

-- Update existing assets to use entity's primary country/currency
UPDATE assets 
SET country = e.primary_country,
    currency = e.primary_currency
FROM entities e 
WHERE assets.entity_id = e.id 
AND (assets.country IS NULL OR assets.currency IS NULL);

-- Make country and currency NOT NULL after setting defaults
ALTER TABLE assets 
ALTER COLUMN country SET NOT NULL,
ALTER COLUMN currency SET NOT NULL;

-- Add country and currency to liabilities table
ALTER TABLE liabilities 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT;

-- Update existing liabilities to use entity's primary country/currency
UPDATE liabilities 
SET country = e.primary_country,
    currency = e.primary_currency
FROM entities e 
WHERE liabilities.entity_id = e.id 
AND (liabilities.country IS NULL OR liabilities.currency IS NULL);

-- Make country and currency NOT NULL after setting defaults
ALTER TABLE liabilities 
ALTER COLUMN country SET NOT NULL,
ALTER COLUMN currency SET NOT NULL;

-- Create country_rules table for financial year computation
CREATE TABLE IF NOT EXISTS country_rules (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  financial_year_start_month INTEGER NOT NULL,
  financial_year_start_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default country rules
INSERT INTO country_rules (country_code, country_name, currency_code, financial_year_start_month, financial_year_start_day) VALUES
  ('AU', 'Australia', 'AUD', 7, 1),
  ('IN', 'India', 'INR', 4, 1),
  ('US', 'United States', 'USD', 1, 1)
ON CONFLICT (country_code) DO NOTHING;

-- Create function to get current financial year for a country
CREATE OR REPLACE FUNCTION get_current_financial_year(country_code TEXT)
RETURNS TABLE(
  start_date DATE,
  end_date DATE,
  name TEXT,
  tax_year INTEGER
) AS $$
DECLARE
  fy_start_month INTEGER;
  fy_start_day INTEGER;
  current_date DATE := CURRENT_DATE;
  fy_start_date DATE;
  fy_end_date DATE;
  fy_name TEXT;
  fy_tax_year INTEGER;
BEGIN
  -- Get country rules
  SELECT financial_year_start_month, financial_year_start_day
  INTO fy_start_month, fy_start_day
  FROM country_rules
  WHERE country_code = $1;
  
  IF NOT FOUND THEN
    -- Default to Australia rules if country not found
    fy_start_month := 7;
    fy_start_day := 1;
  END IF;
  
  -- Calculate current financial year
  fy_start_date := DATE(
    EXTRACT(YEAR FROM current_date)::TEXT || '-' || 
    LPAD(fy_start_month::TEXT, 2, '0') || '-' || 
    LPAD(fy_start_day::TEXT, 2, '0')
  );
  
  -- If current date is before FY start, use previous year
  IF current_date < fy_start_date THEN
    fy_start_date := fy_start_date - INTERVAL '1 year';
  END IF;
  
  fy_end_date := fy_start_date + INTERVAL '1 year' - INTERVAL '1 day';
  fy_tax_year := EXTRACT(YEAR FROM fy_end_date)::INTEGER;
  
  -- Generate name based on country
  IF country_code = 'IN' THEN
    fy_name := 'FY' || (fy_tax_year - 1)::TEXT || '-' || (fy_tax_year % 100)::TEXT;
  ELSE
    fy_name := 'FY' || fy_tax_year::TEXT;
  END IF;
  
  RETURN QUERY SELECT fy_start_date, fy_end_date, fy_name, fy_tax_year;
END;
$$ LANGUAGE plpgsql;

-- Create function to get financial year for a specific date
CREATE OR REPLACE FUNCTION get_financial_year_for_date(country_code TEXT, target_date DATE)
RETURNS TABLE(
  start_date DATE,
  end_date DATE,
  name TEXT,
  tax_year INTEGER
) AS $$
DECLARE
  fy_start_month INTEGER;
  fy_start_day INTEGER;
  fy_start_date DATE;
  fy_end_date DATE;
  fy_name TEXT;
  fy_tax_year INTEGER;
BEGIN
  -- Get country rules
  SELECT financial_year_start_month, financial_year_start_day
  INTO fy_start_month, fy_start_day
  FROM country_rules
  WHERE country_code = $1;
  
  IF NOT FOUND THEN
    -- Default to Australia rules if country not found
    fy_start_month := 7;
    fy_start_day := 1;
  END IF;
  
  -- Calculate financial year for the target date
  fy_start_date := DATE(
    EXTRACT(YEAR FROM target_date)::TEXT || '-' || 
    LPAD(fy_start_month::TEXT, 2, '0') || '-' || 
    LPAD(fy_start_day::TEXT, 2, '0')
  );
  
  -- If target date is before FY start, use previous year
  IF target_date < fy_start_date THEN
    fy_start_date := fy_start_date - INTERVAL '1 year';
  END IF;
  
  fy_end_date := fy_start_date + INTERVAL '1 year' - INTERVAL '1 day';
  fy_tax_year := EXTRACT(YEAR FROM fy_end_date)::INTEGER;
  
  -- Generate name based on country
  IF country_code = 'IN' THEN
    fy_name := 'FY' || (fy_tax_year - 1)::TEXT || '-' || (fy_tax_year % 100)::TEXT;
  ELSE
    fy_name := 'FY' || fy_tax_year::TEXT;
  END IF;
  
  RETURN QUERY SELECT fy_start_date, fy_end_date, fy_name, fy_tax_year;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entities_primary_country ON entities(primary_country);
CREATE INDEX IF NOT EXISTS idx_assets_country ON assets(country);
CREATE INDEX IF NOT EXISTS idx_assets_currency ON assets(currency);
CREATE INDEX IF NOT EXISTS idx_liabilities_country ON liabilities(country);
CREATE INDEX IF NOT EXISTS idx_liabilities_currency ON liabilities(currency);

-- Enable RLS on country_rules (read-only for all authenticated users)
ALTER TABLE country_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated users can read country rules" ON country_rules FOR SELECT USING (auth.role() = 'authenticated'); 