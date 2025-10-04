-- Add missing columns that the application code expects for categories

-- Add missing columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS merchant_patterns text[],
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- Add missing columns to category_groups table  
ALTER TABLE public.category_groups 
ADD COLUMN IF NOT EXISTS category_type text,
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- Add missing columns to category_buckets table
ALTER TABLE public.category_buckets 
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;