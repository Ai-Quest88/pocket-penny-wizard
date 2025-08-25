-- Step 1: Simplify category schema by removing buckets
-- First, migrate existing data from buckets to direct group-category relationship

-- Add group_id to categories table to establish direct relationship
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.category_groups(id);

-- Update existing categories to link directly to groups via their buckets
UPDATE public.categories 
SET group_id = cb.category_id 
FROM public.category_buckets cb 
WHERE public.categories.parent_id = cb.id;

-- Remove the bucket relationship columns
ALTER TABLE public.categories 
DROP COLUMN IF EXISTS parent_id;

-- Step 2: Create default Australian category structure
-- Insert default category groups
INSERT INTO public.category_groups (name, description, category_type, icon, color, user_id, is_ai_generated) 
VALUES
  ('Income', 'All sources of income', 'income', '💰', '#10B981', '00000000-0000-0000-0000-000000000000', false),
  ('Expenses', 'All spending categories', 'expense', '💳', '#EF4444', '00000000-0000-0000-0000-000000000000', false),
  ('Transfers', 'Money movement between accounts', 'transfer', '🔄', '#6366F1', '00000000-0000-0000-0000-000000000000', false),
  ('Assets', 'Asset-related transactions', 'asset', '🏠', '#059669', '00000000-0000-0000-0000-000000000000', false),
  ('Liabilities', 'Liability-related transactions', 'liability', '💸', '#DC2626', '00000000-0000-0000-0000-000000000000', false)
ON CONFLICT DO NOTHING;

-- Insert default income categories
INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
SELECT 
  category_name,
  category_description,
  'income',
  cg.id,
  '00000000-0000-0000-0000-000000000000',
  true,
  false
FROM public.category_groups cg,
(VALUES 
  ('Salary', 'Regular employment income'),
  ('Business Income', 'Income from business activities'),
  ('Investment Income', 'Dividends, interest, capital gains'),
  ('Government Benefits', 'Centrelink, Medicare, tax refunds'),
  ('Rental Income', 'Income from rental properties'),
  ('Other Income', 'Miscellaneous income sources')
) AS income_cats(category_name, category_description)
WHERE cg.category_type = 'income' AND cg.user_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- Insert default expense categories  
INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
SELECT 
  category_name,
  category_description,
  'expense',
  cg.id,
  '00000000-0000-0000-0000-000000000000',
  true,
  false
FROM public.category_groups cg,
(VALUES 
  ('Groceries', 'Supermarket and food shopping'),
  ('Restaurants', 'Dining out and takeaway'),
  ('Transport', 'Public transport, fuel, car expenses'),
  ('Housing', 'Rent, mortgage, utilities, maintenance'),
  ('Healthcare', 'Medical, dental, pharmacy, insurance'),
  ('Entertainment', 'Movies, streaming, events, hobbies'),
  ('Shopping', 'Clothing, electronics, general retail'),
  ('Education', 'Tuition, books, courses, training'),
  ('Insurance', 'Health, car, home, life insurance'),
  ('Phone & Internet', 'Mobile, broadband, telecommunications'),
  ('Banking Fees', 'Account fees, transaction charges'),
  ('Other Expenses', 'Miscellaneous spending')
) AS expense_cats(category_name, category_description)
WHERE cg.category_type = 'expense' AND cg.user_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- Insert default transfer categories
INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
SELECT 
  category_name,
  category_description,
  'transfer',
  cg.id,
  '00000000-0000-0000-0000-000000000000',
  true,
  false
FROM public.category_groups cg,
(VALUES 
  ('Internal Transfer', 'Transfers between own accounts'),
  ('Loan Payment', 'Payments towards loans and credit'),
  ('Savings', 'Transfers to savings accounts'),
  ('Investment Transfer', 'Transfers to investment accounts')
) AS transfer_cats(category_name, category_description)
WHERE cg.category_type = 'transfer' AND cg.user_id = '00000000-0000-0000-0000-000000000000'
ON CONFLICT DO NOTHING;

-- Step 3: Create budget category mappings table for flexible budget groupings
CREATE TABLE IF NOT EXISTS public.budget_categories (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(budget_id, category_id)
);

-- Enable RLS on budget_categories
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for budget_categories
CREATE POLICY "Users can view their budget categories" 
ON public.budget_categories FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.budgets b 
  WHERE b.id = budget_categories.budget_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create budget categories" 
ON public.budget_categories FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.budgets b 
  WHERE b.id = budget_categories.budget_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can update their budget categories" 
ON public.budget_categories FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.budgets b 
  WHERE b.id = budget_categories.budget_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete their budget categories" 
ON public.budget_categories FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.budgets b 
  WHERE b.id = budget_categories.budget_id 
  AND b.user_id = auth.uid()
));

-- Step 4: Create function to copy default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  income_group_id uuid;
  expense_group_id uuid;
  transfer_group_id uuid;
  asset_group_id uuid;
  liability_group_id uuid;
BEGIN
  -- Create category groups for the user
  INSERT INTO public.category_groups (name, description, category_type, icon, color, user_id, is_ai_generated)
  SELECT name, description, category_type, icon, color, target_user_id, false
  FROM public.category_groups 
  WHERE user_id = '00000000-0000-0000-0000-000000000000';
  
  -- Get the new group IDs
  SELECT id INTO income_group_id FROM public.category_groups 
  WHERE user_id = target_user_id AND category_type = 'income';
  
  SELECT id INTO expense_group_id FROM public.category_groups 
  WHERE user_id = target_user_id AND category_type = 'expense';
  
  SELECT id INTO transfer_group_id FROM public.category_groups 
  WHERE user_id = target_user_id AND category_type = 'transfer';
  
  SELECT id INTO asset_group_id FROM public.category_groups 
  WHERE user_id = target_user_id AND category_type = 'asset';
  
  SELECT id INTO liability_group_id FROM public.category_groups 
  WHERE user_id = target_user_id AND category_type = 'liability';
  
  -- Create categories for each group
  INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated)
  SELECT 
    c.name, 
    c.description, 
    c.type, 
    CASE 
      WHEN c.type = 'income' THEN income_group_id
      WHEN c.type = 'expense' THEN expense_group_id  
      WHEN c.type = 'transfer' THEN transfer_group_id
      WHEN c.type = 'asset' THEN asset_group_id
      WHEN c.type = 'liability' THEN liability_group_id
    END,
    target_user_id,
    false,
    false
  FROM public.categories c
  JOIN public.category_groups cg ON c.group_id = cg.id
  WHERE cg.user_id = '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create category discovery sessions table for AI edge function
CREATE TABLE IF NOT EXISTS public.category_discovery_sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  transaction_count integer DEFAULT 0,
  categories_created integer DEFAULT 0,
  groups_created integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their discovery sessions" 
ON public.category_discovery_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create discovery sessions" 
ON public.category_discovery_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their discovery sessions" 
ON public.category_discovery_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- Step 6: Update triggers
CREATE TRIGGER update_category_discovery_sessions_updated_at
  BEFORE UPDATE ON public.category_discovery_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 7: Drop the category_buckets table (after data migration)
DROP TABLE IF EXISTS public.category_buckets CASCADE;