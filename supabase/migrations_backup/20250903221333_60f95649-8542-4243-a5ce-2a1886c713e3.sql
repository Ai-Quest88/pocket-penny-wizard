-- Add Cash Withdrawal category to existing users
DO $$
DECLARE
    user_record RECORD;
    expense_group_id UUID;
    cash_withdrawal_category_id UUID;
BEGIN
    -- Loop through all users who have categories
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM categories 
        WHERE user_id IS NOT NULL
    LOOP
        -- Get the expense group for this user
        SELECT id INTO expense_group_id
        FROM category_groups 
        WHERE user_id = user_record.user_id 
        AND category_type = 'expense'
        LIMIT 1;
        
        -- If expense group exists, add Cash Withdrawal category
        IF expense_group_id IS NOT NULL THEN
            -- Insert Cash Withdrawal category if it doesn't exist
            INSERT INTO categories (user_id, group_id, name, description, type, sort_order)
            VALUES (user_record.user_id, expense_group_id, 'Cash Withdrawal', 'ATM withdrawals and cash transactions', 'expense', 100)
            ON CONFLICT DO NOTHING
            RETURNING id INTO cash_withdrawal_category_id;
            
            -- If conflict happened, get the existing category
            IF cash_withdrawal_category_id IS NULL THEN
                SELECT id INTO cash_withdrawal_category_id 
                FROM categories 
                WHERE user_id = user_record.user_id 
                AND name = 'Cash Withdrawal'
                LIMIT 1;
            END IF;
            
            -- Update existing ATM transactions to use Cash Withdrawal category
            UPDATE transactions 
            SET category_id = cash_withdrawal_category_id
            WHERE user_id = user_record.user_id
            AND (
                LOWER(description) LIKE '%atm%' OR 
                LOWER(description) LIKE '%withdrawal%' OR
                LOWER(description) LIKE '%cash%'
            )
            AND amount < 0; -- Only negative amounts (expenses)
        END IF;
    END LOOP;
END $$;

-- Update the default category creation function to include Cash Withdrawal
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    (target_user_id, expense_group_id, 'Cash Withdrawal', 'ATM withdrawals and cash transactions', 'expense', 7),
    (target_user_id, expense_group_id, 'Other Expenses', 'Miscellaneous expenses', 'expense', 8)
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
$function$;