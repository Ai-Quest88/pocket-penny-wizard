-- Fix security warning: Function search path mutable
-- Update the function to have a proper search path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';