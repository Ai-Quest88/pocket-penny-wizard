-- Make category groups and categories system-level

-- First, add is_system column to category_groups if it doesn't exist
ALTER TABLE category_groups 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Update RLS policies for category_groups to allow access to system groups
DROP POLICY IF EXISTS "Users can view their category groups" ON category_groups;
CREATE POLICY "Users can view category groups" 
ON category_groups 
FOR SELECT 
USING (auth.uid() = user_id OR is_system = true);

DROP POLICY IF EXISTS "Users can create category groups" ON category_groups;
CREATE POLICY "Users can create category groups" 
ON category_groups 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can update their category groups" ON category_groups;
CREATE POLICY "Users can update category groups" 
ON category_groups 
FOR UPDATE 
USING (auth.uid() = user_id OR is_system = true);

DROP POLICY IF EXISTS "Users can delete their category groups" ON category_groups;
CREATE POLICY "Users can delete category groups" 
ON category_groups 
FOR DELETE 
USING (auth.uid() = user_id AND is_system = false);

-- Update RLS policies for categories to allow access to system categories
DROP POLICY IF EXISTS "Users can view their categories" ON categories;
CREATE POLICY "Users can view categories" 
ON categories 
FOR SELECT 
USING (auth.uid() = user_id OR is_system = true);

DROP POLICY IF EXISTS "Users can create categories" ON categories;
CREATE POLICY "Users can create categories" 
ON categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_system = false);

DROP POLICY IF EXISTS "Users can update their categories" ON categories;
CREATE POLICY "Users can update categories" 
ON categories 
FOR UPDATE 
USING (auth.uid() = user_id OR is_system = true);

DROP POLICY IF EXISTS "Users can delete their categories" ON categories;
CREATE POLICY "Users can delete categories" 
ON categories 
FOR DELETE 
USING (auth.uid() = user_id AND is_system = false);

-- Create system category groups (using a dummy system user ID)
INSERT INTO category_groups (user_id, name, description, category_type, icon, is_system) VALUES
('00000000-0000-0000-0000-000000000000', 'Income', 'All income sources', 'income', '💰', true),
('00000000-0000-0000-0000-000000000000', 'Expenses', 'All expense categories', 'expense', '💸', true),
('00000000-0000-0000-0000-000000000000', 'Transfers', 'Account transfers', 'transfer', '🔄', true),
('00000000-0000-0000-0000-000000000000', 'Assets', 'Asset categories', 'asset', '💎', true),
('00000000-0000-0000-0000-000000000000', 'Liabilities', 'Liability categories', 'liability', '💳', true)
ON CONFLICT DO NOTHING;

-- Get the system group IDs and create system categories
DO $$
DECLARE
    income_group_id UUID;
    expense_group_id UUID;
    transfer_group_id UUID;
    asset_group_id UUID;
    liability_group_id UUID;
BEGIN
    -- Get system group IDs
    SELECT id INTO income_group_id FROM category_groups WHERE is_system = true AND category_type = 'income';
    SELECT id INTO expense_group_id FROM category_groups WHERE is_system = true AND category_type = 'expense';
    SELECT id INTO transfer_group_id FROM category_groups WHERE is_system = true AND category_type = 'transfer';
    SELECT id INTO asset_group_id FROM category_groups WHERE is_system = true AND category_type = 'asset';
    SELECT id INTO liability_group_id FROM category_groups WHERE is_system = true AND category_type = 'liability';

    -- Create system income categories
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order, is_system) VALUES
    ('00000000-0000-0000-0000-000000000000', income_group_id, 'Salary', 'Regular employment income', 'income', 1, true),
    ('00000000-0000-0000-0000-000000000000', income_group_id, 'Business Income', 'Income from business activities', 'income', 2, true),
    ('00000000-0000-0000-0000-000000000000', income_group_id, 'Investment Income', 'Dividends, interest, capital gains', 'income', 3, true),
    ('00000000-0000-0000-0000-000000000000', income_group_id, 'Other Income', 'Other sources of income', 'income', 4, true)
    ON CONFLICT DO NOTHING;

    -- Create system expense categories
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order, is_system) VALUES
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Housing', 'Rent, mortgage, utilities', 'expense', 1, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Food & Dining', 'Groceries, restaurants', 'expense', 2, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Transportation', 'Car, public transport, fuel', 'expense', 3, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Healthcare', 'Medical, dental, insurance', 'expense', 4, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Entertainment', 'Movies, hobbies, subscriptions', 'expense', 5, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Shopping', 'Clothing, personal items', 'expense', 6, true),
    ('00000000-0000-0000-0000-000000000000', expense_group_id, 'Other Expenses', 'Miscellaneous expenses', 'expense', 7, true)
    ON CONFLICT DO NOTHING;

    -- Create system transfer category
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order, is_system) VALUES
    ('00000000-0000-0000-0000-000000000000', transfer_group_id, 'Account Transfer', 'Transfers between accounts', 'transfer', 1, true)
    ON CONFLICT DO NOTHING;

    -- Create system asset categories
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order, is_system) VALUES
    ('00000000-0000-0000-0000-000000000000', asset_group_id, 'Cash & Savings', 'Bank accounts and cash holdings', 'asset', 1, true),
    ('00000000-0000-0000-0000-000000000000', asset_group_id, 'Investments', 'Stocks, bonds, mutual funds', 'asset', 2, true),
    ('00000000-0000-0000-0000-000000000000', asset_group_id, 'Property', 'Real estate and property holdings', 'asset', 3, true),
    ('00000000-0000-0000-0000-000000000000', asset_group_id, 'Other Assets', 'Other valuable assets', 'asset', 4, true)
    ON CONFLICT DO NOTHING;

    -- Create system liability categories
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order, is_system) VALUES
    ('00000000-0000-0000-0000-000000000000', liability_group_id, 'Credit Cards', 'Credit card debts', 'liability', 1, true),
    ('00000000-0000-0000-0000-000000000000', liability_group_id, 'Loans', 'Personal and other loans', 'liability', 2, true),
    ('00000000-0000-0000-0000-000000000000', liability_group_id, 'Mortgages', 'Home and investment mortgages', 'liability', 3, true),
    ('00000000-0000-0000-0000-000000000000', liability_group_id, 'Other Liabilities', 'Other debts and obligations', 'liability', 4, true)
    ON CONFLICT DO NOTHING;
END $$;