-- Add assets and liabilities groups to the default categories function
CREATE OR REPLACE FUNCTION create_default_categories_for_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    income_group_id UUID;
    expense_group_id UUID;
    transfer_group_id UUID;
    asset_group_id UUID;
    liability_group_id UUID;
BEGIN
    -- Check if user already has categories
    IF EXISTS (SELECT 1 FROM categories WHERE user_id = target_user_id LIMIT 1) THEN
        RETURN;
    END IF;

    -- Create Income group
    INSERT INTO category_groups (user_id, name, description, category_type, icon)
    VALUES (target_user_id, 'Income', 'All income sources', 'income', '💰')
    ON CONFLICT DO NOTHING
    RETURNING id INTO income_group_id;
    
    -- If conflict happened, get the existing group
    IF income_group_id IS NULL THEN
        SELECT id INTO income_group_id 
        FROM category_groups 
        WHERE user_id = target_user_id AND category_type = 'income' 
        LIMIT 1;
    END IF;

    -- Create Expense group
    INSERT INTO category_groups (user_id, name, description, category_type, icon)
    VALUES (target_user_id, 'Expenses', 'All expense categories', 'expense', '💸')
    ON CONFLICT DO NOTHING
    RETURNING id INTO expense_group_id;
    
    -- If conflict happened, get the existing group
    IF expense_group_id IS NULL THEN
        SELECT id INTO expense_group_id 
        FROM category_groups 
        WHERE user_id = target_user_id AND category_type = 'expense' 
        LIMIT 1;
    END IF;

    -- Create Transfer group
    INSERT INTO category_groups (user_id, name, description, category_type, icon)
    VALUES (target_user_id, 'Transfers', 'Account transfers', 'transfer', '🔄')
    ON CONFLICT DO NOTHING
    RETURNING id INTO transfer_group_id;
    
    -- If conflict happened, get the existing group
    IF transfer_group_id IS NULL THEN
        SELECT id INTO transfer_group_id 
        FROM category_groups 
        WHERE user_id = target_user_id AND category_type = 'transfer' 
        LIMIT 1;
    END IF;

    -- Create Asset group
    INSERT INTO category_groups (user_id, name, description, category_type, icon)
    VALUES (target_user_id, 'Assets', 'Asset categories', 'asset', '💎')
    ON CONFLICT DO NOTHING
    RETURNING id INTO asset_group_id;
    
    -- If conflict happened, get the existing group
    IF asset_group_id IS NULL THEN
        SELECT id INTO asset_group_id 
        FROM category_groups 
        WHERE user_id = target_user_id AND category_type = 'asset' 
        LIMIT 1;
    END IF;

    -- Create Liability group
    INSERT INTO category_groups (user_id, name, description, category_type, icon)
    VALUES (target_user_id, 'Liabilities', 'Liability categories', 'liability', '💳')
    ON CONFLICT DO NOTHING
    RETURNING id INTO liability_group_id;
    
    -- If conflict happened, get the existing group
    IF liability_group_id IS NULL THEN
        SELECT id INTO liability_group_id 
        FROM category_groups 
        WHERE user_id = target_user_id AND category_type = 'liability' 
        LIMIT 1;
    END IF;

    -- Create default income categories (with required type field)
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
    (target_user_id, income_group_id, 'Salary', 'Regular employment income', 'income', 1),
    (target_user_id, income_group_id, 'Business Income', 'Income from business activities', 'income', 2),
    (target_user_id, income_group_id, 'Investment Income', 'Dividends, interest, capital gains', 'income', 3),
    (target_user_id, income_group_id, 'Other Income', 'Other sources of income', 'income', 4)
    ON CONFLICT DO NOTHING;

    -- Create default expense categories (with required type field)
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
    (target_user_id, expense_group_id, 'Housing', 'Rent, mortgage, utilities', 'expense', 1),
    (target_user_id, expense_group_id, 'Food & Dining', 'Groceries, restaurants', 'expense', 2),
    (target_user_id, expense_group_id, 'Transportation', 'Car, public transport, fuel', 'expense', 3),
    (target_user_id, expense_group_id, 'Healthcare', 'Medical, dental, insurance', 'expense', 4),
    (target_user_id, expense_group_id, 'Entertainment', 'Movies, hobbies, subscriptions', 'expense', 5),
    (target_user_id, expense_group_id, 'Shopping', 'Clothing, personal items', 'expense', 6),
    (target_user_id, expense_group_id, 'Other Expenses', 'Miscellaneous expenses', 'expense', 7)
    ON CONFLICT DO NOTHING;

    -- Create default transfer category (with required type field)
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
    (target_user_id, transfer_group_id, 'Account Transfer', 'Transfers between accounts', 'transfer', 1)
    ON CONFLICT DO NOTHING;

    -- Create default asset categories (with required type field)
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
    (target_user_id, asset_group_id, 'Cash & Savings', 'Bank accounts and cash holdings', 'asset', 1),
    (target_user_id, asset_group_id, 'Investments', 'Stocks, bonds, mutual funds', 'asset', 2),
    (target_user_id, asset_group_id, 'Property', 'Real estate and property holdings', 'asset', 3),
    (target_user_id, asset_group_id, 'Other Assets', 'Other valuable assets', 'asset', 4)
    ON CONFLICT DO NOTHING;

    -- Create default liability categories (with required type field)
    INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
    (target_user_id, liability_group_id, 'Credit Cards', 'Credit card debts', 'liability', 1),
    (target_user_id, liability_group_id, 'Loans', 'Personal and other loans', 'liability', 2),
    (target_user_id, liability_group_id, 'Mortgages', 'Home and investment mortgages', 'liability', 3),
    (target_user_id, liability_group_id, 'Other Liabilities', 'Other debts and obligations', 'liability', 4)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;