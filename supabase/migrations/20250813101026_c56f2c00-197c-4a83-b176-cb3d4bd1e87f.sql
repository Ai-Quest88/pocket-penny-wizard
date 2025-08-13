-- Comprehensive update to seed_default_categories function for complete transaction coverage
CREATE OR REPLACE FUNCTION public.seed_default_categories()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_income_group uuid;
  v_expenses_group uuid;
  v_assets_group uuid;
  v_liabilities_group uuid;
  v_transfers_group uuid;
  v_existing_count int;
  b_primary_income uuid;
  b_housing uuid;
  b_transport uuid;
  b_groceries uuid;
  b_internal uuid;
  b_utilities uuid;
  b_entertainment uuid;
  b_healthcare uuid;
  b_shopping uuid;
  b_dining uuid;
  b_education uuid;
  b_personal_care uuid;
  b_professional uuid;
  b_shares_etfs uuid;
  b_superannuation uuid;
  b_crypto uuid;
  b_alternative uuid;
  b_cash_accounts uuid;
  b_property uuid;
  b_food_delivery uuid;
  b_subscriptions uuid;
  b_gifts_donations uuid;
  b_financial_services uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT count(*) INTO v_existing_count FROM public.category_buckets WHERE user_id = v_user;
  IF v_existing_count > 0 THEN
    RETURN; -- already seeded or user has buckets
  END IF;

  SELECT id INTO v_income_group FROM public.category_groups WHERE key='income' LIMIT 1;
  SELECT id INTO v_expenses_group FROM public.category_groups WHERE key='expenses' LIMIT 1;
  SELECT id INTO v_assets_group FROM public.category_groups WHERE key='assets' LIMIT 1;
  SELECT id INTO v_liabilities_group FROM public.category_groups WHERE key='liabilities' LIMIT 1;
  SELECT id INTO v_transfers_group FROM public.category_groups WHERE key='transfers' LIMIT 1;

  -- Create Income buckets and categories
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_income_group, 'Primary Income', 10)
  RETURNING id INTO b_primary_income;

  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_primary_income, 'Salary', 10),
    (v_user, b_primary_income, 'Wage', 20),
    (v_user, b_primary_income, 'Bonus', 30),
    (v_user, b_primary_income, 'Freelance', 40),
    (v_user, b_primary_income, 'Investment Income', 50),
    (v_user, b_primary_income, 'Rental Income', 60),
    (v_user, b_primary_income, 'Government Benefits', 70),
    (v_user, b_primary_income, 'Pension', 80),
    (v_user, b_primary_income, 'Interest', 90),
    (v_user, b_primary_income, 'Dividends', 100),
    (v_user, b_primary_income, 'Other Income', 110);

  -- Create comprehensive Expense buckets and categories
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES 
    (v_user, v_expenses_group, 'Housing', 10),
    (v_user, v_expenses_group, 'Transport', 20),
    (v_user, v_expenses_group, 'Groceries', 30),
    (v_user, v_expenses_group, 'Utilities', 40),
    (v_user, v_expenses_group, 'Entertainment', 50),
    (v_user, v_expenses_group, 'Healthcare', 60),
    (v_user, v_expenses_group, 'Shopping', 70),
    (v_user, v_expenses_group, 'Dining', 80),
    (v_user, v_expenses_group, 'Education', 90),
    (v_user, v_expenses_group, 'Personal Care', 100),
    (v_user, v_expenses_group, 'Professional Services', 110),
    (v_user, v_expenses_group, 'Food Delivery', 120),
    (v_user, v_expenses_group, 'Subscriptions', 130),
    (v_user, v_expenses_group, 'Gifts & Donations', 140),
    (v_user, v_expenses_group, 'Financial Services', 150)
  RETURNING 
    CASE WHEN name = 'Housing' THEN id END,
    CASE WHEN name = 'Transport' THEN id END,
    CASE WHEN name = 'Groceries' THEN id END,
    CASE WHEN name = 'Utilities' THEN id END,
    CASE WHEN name = 'Entertainment' THEN id END,
    CASE WHEN name = 'Healthcare' THEN id END,
    CASE WHEN name = 'Shopping' THEN id END,
    CASE WHEN name = 'Dining' THEN id END,
    CASE WHEN name = 'Education' THEN id END,
    CASE WHEN name = 'Personal Care' THEN id END,
    CASE WHEN name = 'Professional Services' THEN id END,
    CASE WHEN name = 'Food Delivery' THEN id END,
    CASE WHEN name = 'Subscriptions' THEN id END,
    CASE WHEN name = 'Gifts & Donations' THEN id END,
    CASE WHEN name = 'Financial Services' THEN id END
  INTO b_housing, b_transport, b_groceries, b_utilities, b_entertainment, b_healthcare, b_shopping, b_dining, b_education, b_personal_care, b_professional, b_food_delivery, b_subscriptions, b_gifts_donations, b_financial_services;

  -- Housing categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_housing, 'Rent', 10),
    (v_user, b_housing, 'Mortgage', 20),
    (v_user, b_housing, 'Home Insurance', 30),
    (v_user, b_housing, 'Property Tax', 40),
    (v_user, b_housing, 'Repairs & Maintenance', 50);

  -- Transport categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_transport, 'Fuel', 10),
    (v_user, b_transport, 'Gas', 20),
    (v_user, b_transport, 'Public Transport', 30),
    (v_user, b_transport, 'Tolls', 40),
    (v_user, b_transport, 'Car Registration', 50),
    (v_user, b_transport, 'Car Insurance', 60),
    (v_user, b_transport, 'Car Service', 70),
    (v_user, b_transport, 'Uber/Taxi', 80),
    (v_user, b_transport, 'Parking', 90);

  -- Groceries categories  
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_groceries, 'Supermarket', 10),
    (v_user, b_groceries, 'Groceries', 20),
    (v_user, b_groceries, 'Butcher', 30),
    (v_user, b_groceries, 'Bakery', 40),
    (v_user, b_groceries, 'Fresh Market', 50);

  -- Utilities categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_utilities, 'Electricity', 10),
    (v_user, b_utilities, 'Gas', 20),
    (v_user, b_utilities, 'Water', 30),
    (v_user, b_utilities, 'Internet', 40),
    (v_user, b_utilities, 'Phone', 50),
    (v_user, b_utilities, 'Mobile', 60);

  -- Entertainment categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_entertainment, 'Movies', 10),
    (v_user, b_entertainment, 'Concerts', 20),
    (v_user, b_entertainment, 'Sports Events', 30),
    (v_user, b_entertainment, 'Gaming', 40),
    (v_user, b_entertainment, 'Books', 50),
    (v_user, b_entertainment, 'Hobbies', 60),
    (v_user, b_entertainment, 'Streaming Services', 70);

  -- Healthcare categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_healthcare, 'Doctor', 10),
    (v_user, b_healthcare, 'Dentist', 20),
    (v_user, b_healthcare, 'Pharmacy', 30),
    (v_user, b_healthcare, 'Health Insurance', 40),
    (v_user, b_healthcare, 'Specialist', 50),
    (v_user, b_healthcare, 'Mental Health', 60);

  -- Shopping categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_shopping, 'Clothing', 10),
    (v_user, b_shopping, 'Electronics', 20),
    (v_user, b_shopping, 'Home & Garden', 30),
    (v_user, b_shopping, 'Furniture', 40),
    (v_user, b_shopping, 'Hardware', 50),
    (v_user, b_shopping, 'General Shopping', 60);

  -- Dining categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_dining, 'Restaurants', 10),
    (v_user, b_dining, 'Fast Food', 20),
    (v_user, b_dining, 'Cafes', 30),
    (v_user, b_dining, 'Bars & Pubs', 40),
    (v_user, b_dining, 'Takeaway', 50);

  -- Education categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_education, 'School Fees', 10),
    (v_user, b_education, 'University', 20),
    (v_user, b_education, 'Training Courses', 30),
    (v_user, b_education, 'Books & Supplies', 40),
    (v_user, b_education, 'Online Learning', 50);

  -- Personal Care categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_personal_care, 'Haircut', 10),
    (v_user, b_personal_care, 'Beauty', 20),
    (v_user, b_personal_care, 'Spa', 30),
    (v_user, b_personal_care, 'Gym', 40),
    (v_user, b_personal_care, 'Personal Items', 50);

  -- Professional Services categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_professional, 'Legal', 10),
    (v_user, b_professional, 'Accounting', 20),
    (v_user, b_professional, 'Consulting', 30),
    (v_user, b_professional, 'Insurance', 40),
    (v_user, b_professional, 'Real Estate', 50);

  -- Food Delivery categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_food_delivery, 'Uber Eats', 10),
    (v_user, b_food_delivery, 'DoorDash', 20),
    (v_user, b_food_delivery, 'Menulog', 30),
    (v_user, b_food_delivery, 'Deliveroo', 40),
    (v_user, b_food_delivery, 'Food Delivery', 50);

  -- Subscriptions categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_subscriptions, 'Netflix', 10),
    (v_user, b_subscriptions, 'Spotify', 20),
    (v_user, b_subscriptions, 'Apple Music', 30),
    (v_user, b_subscriptions, 'Disney+', 40),
    (v_user, b_subscriptions, 'Software', 50),
    (v_user, b_subscriptions, 'Magazine', 60),
    (v_user, b_subscriptions, 'News', 70);

  -- Gifts & Donations categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_gifts_donations, 'Gifts', 10),
    (v_user, b_gifts_donations, 'Charity', 20),
    (v_user, b_gifts_donations, 'Donations', 30),
    (v_user, b_gifts_donations, 'Church', 40);

  -- Financial Services categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    (v_user, b_financial_services, 'Banking Fees', 10),
    (v_user, b_financial_services, 'Investment Fees', 20),
    (v_user, b_financial_services, 'Trading Fees', 30),
    (v_user, b_financial_services, 'ATM Fees', 40),
    (v_user, b_financial_services, 'Financial Advice', 50),
    (v_user, b_financial_services, 'Taxes', 60);

  -- Create Asset buckets (including former investments)
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES 
    (v_user, v_assets_group, 'Cash & Bank Accounts', 10),
    (v_user, v_assets_group, 'Property', 20),
    (v_user, v_assets_group, 'Shares & ETFs', 30),
    (v_user, v_assets_group, 'Superannuation', 40),
    (v_user, v_assets_group, 'Cryptocurrency', 50),
    (v_user, v_assets_group, 'Alternative Investments', 60);

  -- Create Transfers bucket and category
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_transfers_group, 'Transfers', 10)
  RETURNING id INTO b_internal;

  INSERT INTO public.categories (user_id, bucket_id, name, is_transfer, sort_order)
  VALUES 
    (v_user, b_internal, 'Internal Transfer', true, 10),
    (v_user, b_internal, 'Transfer In', true, 20),
    (v_user, b_internal, 'Transfer Out', true, 30),
    (v_user, b_internal, 'Uncategorized', false, 40);
END;
$function$;