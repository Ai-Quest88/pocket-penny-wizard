-- Part 2: Update seed_default_categories function to reflect assets structure

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
    (v_user, b_primary_income, 'Rental Income', 60);

  -- Create Expense buckets and categories
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
    (v_user, v_expenses_group, 'Professional Services', 110)
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
    CASE WHEN name = 'Professional Services' THEN id END
  INTO b_housing, b_transport, b_groceries, b_utilities, b_entertainment, b_healthcare, b_shopping, b_dining, b_education, b_personal_care, b_professional;

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
  VALUES (v_user, b_internal, 'Internal Transfer', true, 10);
END;
$function$;