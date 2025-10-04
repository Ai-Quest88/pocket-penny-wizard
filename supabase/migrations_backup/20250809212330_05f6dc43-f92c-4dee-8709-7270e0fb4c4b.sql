-- Fix the seed_default_categories function
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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

  -- Create default buckets one by one
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_income_group, 'Primary Income', 10)
  RETURNING id INTO b_primary_income;

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
  VALUES (v_user, v_transfers_group, 'Transfers', 10)
  RETURNING id INTO b_internal;

  -- Default categories
  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES (v_user, b_primary_income, 'Salary', 10),
         (v_user, b_primary_income, 'Bonus', 20);

  INSERT INTO public.categories (user_id, bucket_id, name, sort_order)
  VALUES (v_user, b_housing, 'Rent', 10),
         (v_user, b_housing, 'Mortgage', 20),
         (v_user, b_groceries, 'Supermarket', 10),
         (v_user, b_transport, 'Fuel', 10);

  -- Transfers bucket/category
  INSERT INTO public.categories (user_id, bucket_id, name, is_transfer, sort_order)
  VALUES (v_user, b_internal, 'Internal Transfer', true, 10);
END;
$$;