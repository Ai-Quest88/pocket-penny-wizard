-- Create missing asset and liability groups for existing users
DO $$
DECLARE
    user_record RECORD;
    asset_group_id UUID;
    liability_group_id UUID;
BEGIN
    -- Loop through all users who have categories but are missing asset/liability groups
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM categories c
        WHERE NOT EXISTS (
            SELECT 1 FROM category_groups cg 
            WHERE cg.user_id = c.user_id AND cg.category_type = 'asset'
        )
        OR NOT EXISTS (
            SELECT 1 FROM category_groups cg 
            WHERE cg.user_id = c.user_id AND cg.category_type = 'liability'
        )
    LOOP
        -- Create Asset group if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM category_groups 
            WHERE user_id = user_record.user_id AND category_type = 'asset'
        ) THEN
            INSERT INTO category_groups (user_id, name, description, category_type, icon)
            VALUES (user_record.user_id, 'Assets', 'Asset categories', 'asset', '💎')
            RETURNING id INTO asset_group_id;
            
            -- Create default asset categories
            INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
            (user_record.user_id, asset_group_id, 'Cash & Savings', 'Bank accounts and cash holdings', 'asset', 1),
            (user_record.user_id, asset_group_id, 'Investments', 'Stocks, bonds, mutual funds', 'asset', 2),
            (user_record.user_id, asset_group_id, 'Property', 'Real estate and property holdings', 'asset', 3),
            (user_record.user_id, asset_group_id, 'Other Assets', 'Other valuable assets', 'asset', 4);
        END IF;
        
        -- Create Liability group if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM category_groups 
            WHERE user_id = user_record.user_id AND category_type = 'liability'
        ) THEN
            INSERT INTO category_groups (user_id, name, description, category_type, icon)
            VALUES (user_record.user_id, 'Liabilities', 'Liability categories', 'liability', '💳')
            RETURNING id INTO liability_group_id;
            
            -- Create default liability categories
            INSERT INTO categories (user_id, group_id, name, description, type, sort_order) VALUES
            (user_record.user_id, liability_group_id, 'Credit Cards', 'Credit card debts', 'liability', 1),
            (user_record.user_id, liability_group_id, 'Loans', 'Personal and other loans', 'liability', 2),
            (user_record.user_id, liability_group_id, 'Mortgages', 'Home and investment mortgages', 'liability', 3),
            (user_record.user_id, liability_group_id, 'Other Liabilities', 'Other debts and obligations', 'liability', 4);
        END IF;
    END LOOP;
END $$;