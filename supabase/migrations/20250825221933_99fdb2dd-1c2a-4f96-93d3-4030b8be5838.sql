-- Step 1: Simplify category schema by removing buckets
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

-- Step 2: Create budget category mappings table for flexible budget groupings
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

-- Step 3: Create function to create default categories for new users
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
  VALUES
    ('Income', 'All sources of income', 'income', '💰', '#10B981', target_user_id, false),
    ('Expenses', 'All spending categories', 'expense', '💳', '#EF4444', target_user_id, false),
    ('Transfers', 'Money movement between accounts', 'transfer', '🔄', '#6366F1', target_user_id, false),
    ('Assets', 'Asset-related transactions', 'asset', '🏠', '#059669', target_user_id, false),
    ('Liabilities', 'Liability-related transactions', 'liability', '💸', '#DC2626', target_user_id, false)
  RETURNING id INTO income_group_id;
  
  -- Get the group IDs
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
  
  -- Create default income categories
  INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
  VALUES
    ('Salary', 'Regular employment income', 'income', income_group_id, target_user_id, true, false),
    ('Business Income', 'Income from business activities', 'income', income_group_id, target_user_id, true, false),
    ('Investment Income', 'Dividends, interest, capital gains', 'income', income_group_id, target_user_id, true, false),
    ('Government Benefits', 'Centrelink, Medicare, tax refunds', 'income', income_group_id, target_user_id, true, false),
    ('Rental Income', 'Income from rental properties', 'income', income_group_id, target_user_id, true, false),
    ('Other Income', 'Miscellaneous income sources', 'income', income_group_id, target_user_id, true, false);
  
  -- Create default expense categories
  INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
  VALUES
    ('Groceries', 'Supermarket and food shopping', 'expense', expense_group_id, target_user_id, true, false),
    ('Restaurants', 'Dining out and takeaway', 'expense', expense_group_id, target_user_id, true, false),
    ('Transport', 'Public transport, fuel, car expenses', 'expense', expense_group_id, target_user_id, true, false),
    ('Housing', 'Rent, mortgage, utilities, maintenance', 'expense', expense_group_id, target_user_id, true, false),
    ('Healthcare', 'Medical, dental, pharmacy, insurance', 'expense', expense_group_id, target_user_id, true, false),
    ('Entertainment', 'Movies, streaming, events, hobbies', 'expense', expense_group_id, target_user_id, true, false),
    ('Shopping', 'Clothing, electronics, general retail', 'expense', expense_group_id, target_user_id, true, false),
    ('Education', 'Tuition, books, courses, training', 'expense', expense_group_id, target_user_id, true, false),
    ('Insurance', 'Health, car, home, life insurance', 'expense', expense_group_id, target_user_id, true, false),
    ('Phone & Internet', 'Mobile, broadband, telecommunications', 'expense', expense_group_id, target_user_id, true, false),
    ('Banking Fees', 'Account fees, transaction charges', 'expense', expense_group_id, target_user_id, true, false),
    ('Other Expenses', 'Miscellaneous spending', 'expense', expense_group_id, target_user_id, true, false);
  
  -- Create default transfer categories
  INSERT INTO public.categories (name, description, type, group_id, user_id, is_system, is_ai_generated) 
  VALUES
    ('Internal Transfer', 'Transfers between own accounts', 'transfer', transfer_group_id, target_user_id, true, false),
    ('Loan Payment', 'Payments towards loans and credit', 'transfer', transfer_group_id, target_user_id, true, false),
    ('Savings', 'Transfers to savings accounts', 'transfer', transfer_group_id, target_user_id, true, false),
    ('Investment Transfer', 'Transfers to investment accounts', 'transfer', transfer_group_id, target_user_id, true, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create category discovery sessions table for AI edge function
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

-- Step 5: Update triggers
CREATE TRIGGER update_category_discovery_sessions_updated_at
  BEFORE UPDATE ON public.category_discovery_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Drop the category_buckets table (after data migration)
DROP TABLE IF EXISTS public.category_buckets CASCADE;