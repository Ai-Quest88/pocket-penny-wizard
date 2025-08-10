-- Update the seed_default_categories function to include more comprehensive basic categories
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
    (v_user, b_primary_income, 'Bonus', 20),
    (v_user, b_primary_income, 'Freelance', 30),
    (v_user, b_primary_income, 'Investment Income', 40);

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

  -- Insert categories for all buckets
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES 
    -- Housing
    (v_user, b_housing, 'Rent', 10),
    (v_user, b_housing, 'Mortgage', 20),
    (v_user, b_housing, 'Home Insurance', 30),
    (v_user, b_housing, 'Property Tax', 40),
    (v_user, b_housing, 'Home Maintenance', 50),
    
    -- Transport
    (v_user, b_transport, 'Fuel', 10),
    (v_user, b_transport, 'Public Transport', 20),
    (v_user, b_transport, 'Car Insurance', 30),
    (v_user, b_transport, 'Car Maintenance', 40),
    (v_user, b_transport, 'Parking', 50),
    (v_user, b_transport, 'Tolls', 60),
    
    -- Groceries
    (v_user, b_groceries, 'Supermarket', 10),
    (v_user, b_groceries, 'Organic Food', 20),
    (v_user, b_groceries, 'Specialty Foods', 30),
    
    -- Utilities
    (v_user, b_utilities, 'Electricity', 10),
    (v_user, b_utilities, 'Gas', 20),
    (v_user, b_utilities, 'Water', 30),
    (v_user, b_utilities, 'Internet', 40),
    (v_user, b_utilities, 'Phone', 50),
    (v_user, b_utilities, 'Trash & Recycling', 60),
    
    -- Entertainment
    (v_user, b_entertainment, 'Movies', 10),
    (v_user, b_entertainment, 'Streaming Services', 20),
    (v_user, b_entertainment, 'Music', 30),
    (v_user, b_entertainment, 'Gaming', 40),
    (v_user, b_entertainment, 'Books', 50),
    (v_user, b_entertainment, 'Hobbies', 60),
    
    -- Healthcare
    (v_user, b_healthcare, 'Doctor Visits', 10),
    (v_user, b_healthcare, 'Prescriptions', 20),
    (v_user, b_healthcare, 'Dental', 30),
    (v_user, b_healthcare, 'Vision', 40),
    (v_user, b_healthcare, 'Health Insurance', 50),
    
    -- Shopping
    (v_user, b_shopping, 'Clothing', 10),
    (v_user, b_shopping, 'Electronics', 20),
    (v_user, b_shopping, 'Home & Garden', 30),
    (v_user, b_shopping, 'Gifts', 40),
    (v_user, b_shopping, 'Online Shopping', 50),
    
    -- Dining
    (v_user, b_dining, 'Restaurants', 10),
    (v_user, b_dining, 'Fast Food', 20),
    (v_user, b_dining, 'Coffee', 30),
    (v_user, b_dining, 'Food Delivery', 40),
    
    -- Education
    (v_user, b_education, 'Tuition', 10),
    (v_user, b_education, 'Books & Supplies', 20),
    (v_user, b_education, 'Online Courses', 30),
    (v_user, b_education, 'Workshops', 40),
    
    -- Personal Care
    (v_user, b_personal_care, 'Haircut', 10),
    (v_user, b_personal_care, 'Skincare', 20),
    (v_user, b_personal_care, 'Gym Membership', 30),
    (v_user, b_personal_care, 'Spa & Wellness', 40),
    
    -- Professional Services
    (v_user, b_professional, 'Legal Fees', 10),
    (v_user, b_professional, 'Accounting', 20),
    (v_user, b_professional, 'Financial Advisor', 30),
    (v_user, b_professional, 'Insurance', 40);

  -- Create Transfers bucket and category
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_transfers_group, 'Transfers', 10)
  RETURNING id INTO b_internal;

  INSERT INTO public.categories (user_id, bucket_id, name, is_transfer, sort_order)
  VALUES (v_user, b_internal, 'Internal Transfer', true, 10);
END;
$function$;