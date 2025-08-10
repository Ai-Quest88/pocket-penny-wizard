-- Update the seed_default_categories function with Australian-appropriate categories
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
  v_investments_group uuid;
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
  SELECT id INTO v_investments_group FROM public.category_groups WHERE key='investments' LIMIT 1;

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
    (v_user, b_primary_income, 'Rental Income', 60);

  -- Create Expense buckets and categories
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Housing', 10)
  RETURNING id INTO b_housing;
  
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Transport', 20)
  RETURNING id INTO b_transport;
  
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Groceries', 30)
  RETURNING id INTO b_groceries;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Utilities', 40)
  RETURNING id INTO b_utilities;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Entertainment', 50)
  RETURNING id INTO b_entertainment;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Healthcare', 60)
  RETURNING id INTO b_healthcare;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Shopping', 70)
  RETURNING id INTO b_shopping;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Dining', 80)
  RETURNING id INTO b_dining;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Education', 90)
  RETURNING id INTO b_education;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Personal Care', 100)
  RETURNING id INTO b_personal_care;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Professional Services', 110)
  RETURNING id INTO b_professional;

  -- Insert categories for all expense buckets
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    -- Housing (Australian terms)
    (v_user, b_housing, 'Rent', 10),
    (v_user, b_housing, 'Mortgage', 20),
    (v_user, b_housing, 'Home Insurance', 30),
    (v_user, b_housing, 'Council Rates', 40),
    (v_user, b_housing, 'Strata Fees', 50),
    (v_user, b_housing, 'Home Maintenance', 60),
    
    -- Transport (Australian terms)
    (v_user, b_transport, 'Petrol', 10),
    (v_user, b_transport, 'Public Transport', 20),
    (v_user, b_transport, 'Car Insurance', 30),
    (v_user, b_transport, 'Car Registration', 40),
    (v_user, b_transport, 'Car Service', 50),
    (v_user, b_transport, 'Parking', 60),
    (v_user, b_transport, 'Tolls', 70),
    
    -- Groceries
    (v_user, b_groceries, 'Supermarket', 10),
    (v_user, b_groceries, 'Fresh Produce', 20),
    (v_user, b_groceries, 'Specialty Foods', 30),
    (v_user, b_groceries, 'Household Items', 40),
    
    -- Utilities
    (v_user, b_utilities, 'Electricity', 10),
    (v_user, b_utilities, 'Gas', 20),
    (v_user, b_utilities, 'Water', 30),
    (v_user, b_utilities, 'Internet', 40),
    (v_user, b_utilities, 'Mobile Phone', 50),
    (v_user, b_utilities, 'Home Phone', 60),
    
    -- Entertainment
    (v_user, b_entertainment, 'Movies', 10),
    (v_user, b_entertainment, 'Streaming Services', 20),
    (v_user, b_entertainment, 'Music', 30),
    (v_user, b_entertainment, 'Gaming', 40),
    (v_user, b_entertainment, 'Books', 50),
    (v_user, b_entertainment, 'Hobbies', 60),
    (v_user, b_entertainment, 'Sports & Recreation', 70),
    
    -- Healthcare (Australian terms)
    (v_user, b_healthcare, 'GP Visits', 10),
    (v_user, b_healthcare, 'Specialist', 20),
    (v_user, b_healthcare, 'Prescriptions', 30),
    (v_user, b_healthcare, 'Dental', 40),
    (v_user, b_healthcare, 'Optometry', 50),
    (v_user, b_healthcare, 'Private Health Insurance', 60),
    (v_user, b_healthcare, 'Physiotherapy', 70),
    
    -- Shopping
    (v_user, b_shopping, 'Clothing', 10),
    (v_user, b_shopping, 'Electronics', 20),
    (v_user, b_shopping, 'Home & Garden', 30),
    (v_user, b_shopping, 'Gifts', 40),
    (v_user, b_shopping, 'Online Shopping', 50),
    
    -- Dining
    (v_user, b_dining, 'Restaurants', 10),
    (v_user, b_dining, 'Takeaway', 20),
    (v_user, b_dining, 'Coffee', 30),
    (v_user, b_dining, 'Food Delivery', 40),
    (v_user, b_dining, 'Pub & Bar', 50),
    
    -- Education
    (v_user, b_education, 'School Fees', 10),
    (v_user, b_education, 'University Fees', 20),
    (v_user, b_education, 'TAFE Courses', 30),
    (v_user, b_education, 'Books & Supplies', 40),
    (v_user, b_education, 'Online Courses', 50),
    
    -- Personal Care
    (v_user, b_personal_care, 'Haircut', 10),
    (v_user, b_personal_care, 'Beauty', 20),
    (v_user, b_personal_care, 'Gym Membership', 30),
    (v_user, b_personal_care, 'Spa & Wellness', 40),
    
    -- Professional Services
    (v_user, b_professional, 'Accountant', 10),
    (v_user, b_professional, 'Legal Services', 20),
    (v_user, b_professional, 'Financial Advisor', 30),
    (v_user, b_professional, 'Insurance', 40);

  -- Create Investment buckets and categories (Australian terms)
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_investments_group, 'Shares & ETFs', 10)
  RETURNING id INTO b_shares_etfs;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_investments_group, 'Superannuation', 20)
  RETURNING id INTO b_superannuation;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_investments_group, 'Cryptocurrency', 30)
  RETURNING id INTO b_crypto;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_investments_group, 'Alternative Investments', 40)
  RETURNING id INTO b_alternative;

  -- Insert investment categories (Australian terms)
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    -- Shares & ETFs
    (v_user, b_shares_etfs, 'ASX Shares', 10),
    (v_user, b_shares_etfs, 'International Shares', 20),
    (v_user, b_shares_etfs, 'ETFs', 30),
    (v_user, b_shares_etfs, 'Managed Funds', 40),
    (v_user, b_shares_etfs, 'Index Funds', 50),
    
    -- Superannuation
    (v_user, b_superannuation, 'Employer Super', 10),
    (v_user, b_superannuation, 'Salary Sacrifice', 20),
    (v_user, b_superannuation, 'Personal Contributions', 30),
    (v_user, b_superannuation, 'Government Co-contribution', 40),
    (v_user, b_superannuation, 'SMSF', 50),
    
    -- Cryptocurrency
    (v_user, b_crypto, 'Bitcoin', 10),
    (v_user, b_crypto, 'Ethereum', 20),
    (v_user, b_crypto, 'Altcoins', 30),
    (v_user, b_crypto, 'Stablecoins', 40),
    
    -- Alternative Investments
    (v_user, b_alternative, 'Investment Property', 10),
    (v_user, b_alternative, 'REITs', 20),
    (v_user, b_alternative, 'Commodities', 30),
    (v_user, b_alternative, 'Bonds', 40),
    (v_user, b_alternative, 'Term Deposits', 50);

  -- Create Transfers bucket and category
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_transfers_group, 'Transfers', 10)
  RETURNING id INTO b_internal;

  INSERT INTO public.categories (user_id, bucket_id, name, is_transfer, sort_order)
  VALUES (v_user, b_internal, 'Internal Transfer', true, 10);
END;
$function$;