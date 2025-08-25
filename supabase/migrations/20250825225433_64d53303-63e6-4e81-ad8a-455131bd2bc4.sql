-- Fix the create_default_categories_for_user function to remove sort_order references
CREATE OR REPLACE FUNCTION create_default_categories_for_user(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    income_group_id UUID;
    expense_group_id UUID;
    transfer_group_id UUID;
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

    -- Create default income categories
    INSERT INTO categories (user_id, group_id, name, description, sort_order) VALUES
    (target_user_id, income_group_id, 'Salary', 'Regular employment income', 1),
    (target_user_id, income_group_id, 'Business Income', 'Income from business activities', 2),
    (target_user_id, income_group_id, 'Investment Income', 'Dividends, interest, capital gains', 3),
    (target_user_id, income_group_id, 'Other Income', 'Other sources of income', 4)
    ON CONFLICT DO NOTHING;

    -- Create default expense categories
    INSERT INTO categories (user_id, group_id, name, description, sort_order) VALUES
    (target_user_id, expense_group_id, 'Housing', 'Rent, mortgage, utilities', 1),
    (target_user_id, expense_group_id, 'Food & Dining', 'Groceries, restaurants', 2),
    (target_user_id, expense_group_id, 'Transportation', 'Car, public transport, fuel', 3),
    (target_user_id, expense_group_id, 'Healthcare', 'Medical, dental, insurance', 4),
    (target_user_id, expense_group_id, 'Entertainment', 'Movies, hobbies, subscriptions', 5),
    (target_user_id, expense_group_id, 'Shopping', 'Clothing, personal items', 6),
    (target_user_id, expense_group_id, 'Other Expenses', 'Miscellaneous expenses', 7)
    ON CONFLICT DO NOTHING;

    -- Create default transfer category
    INSERT INTO categories (user_id, group_id, name, description, sort_order) VALUES
    (target_user_id, transfer_group_id, 'Account Transfer', 'Transfers between accounts', 1)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;