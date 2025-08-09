-- 1) CATEGORY GROUPS (global, fixed)
CREATE TABLE IF NOT EXISTS public.category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
-- Groups are readable by authenticated users; they are fixed and not user-owned
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'category_groups' AND policyname = 'Groups are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Groups are viewable by authenticated users" ON public.category_groups
    FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
-- Prevent inserts/updates/deletes from clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'category_groups' AND policyname = 'No writes to groups'
  ) THEN
    CREATE POLICY "No writes to groups" ON public.category_groups
    FOR ALL TO authenticated USING (false) WITH CHECK (false);
  END IF;
END $$;

-- Seed fixed groups if missing
INSERT INTO public.category_groups (key, name, sort_order)
VALUES
  ('income', 'Income', 10),
  ('expenses', 'Expenses', 20),
  ('assets', 'Assets', 30),
  ('liabilities', 'Liabilities', 40),
  ('transfers', 'Transfers', 50)
ON CONFLICT (key) DO NOTHING;

-- 2) BUCKETS (per-user)
CREATE TABLE IF NOT EXISTS public.category_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.category_groups(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.category_buckets ENABLE ROW LEVEL SECURITY;

-- Per-user RLS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_buckets' AND policyname='Users can view their own buckets'
  ) THEN
    CREATE POLICY "Users can view their own buckets" ON public.category_buckets
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_buckets' AND policyname='Users can insert their own buckets'
  ) THEN
    CREATE POLICY "Users can insert their own buckets" ON public.category_buckets
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_buckets' AND policyname='Users can update their own buckets'
  ) THEN
    CREATE POLICY "Users can update their own buckets" ON public.category_buckets
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='category_buckets' AND policyname='Users can delete their own buckets'
  ) THEN
    CREATE POLICY "Users can delete their own buckets" ON public.category_buckets
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_category_buckets_user_id ON public.category_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_buckets_group_id ON public.category_buckets(group_id);

-- 3) CATEGORIES (per-user)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_id UUID NOT NULL REFERENCES public.category_buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_transfer BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Per-user RLS for categories
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='Users can view their own categories'
  ) THEN
    CREATE POLICY "Users can view their own categories" ON public.categories
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='Users can insert their own categories'
  ) THEN
    CREATE POLICY "Users can insert their own categories" ON public.categories
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='Users can update their own categories'
  ) THEN
    CREATE POLICY "Users can update their own categories" ON public.categories
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='categories' AND policyname='Users can delete their own categories'
  ) THEN
    CREATE POLICY "Users can delete their own categories" ON public.categories
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_bucket_id ON public.categories(bucket_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_name_per_bucket_user ON public.categories(user_id, bucket_id, name);

-- 4) Optional link on transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='transactions' AND column_name='category_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN category_id UUID NULL;
    -- Note: Not adding FK to avoid cross-user constraints issues; we'll keep app-side validation
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);

-- 5) Seeder RPC to populate defaults per user on first run
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

  SELECT id INTO v_income_group FROM public.category_groups WHERE key='income';
  SELECT id INTO v_expenses_group FROM public.category_groups WHERE key='expenses';
  SELECT id INTO v_assets_group FROM public.category_groups WHERE key='assets';
  SELECT id INTO v_liabilities_group FROM public.category_groups WHERE key='liabilities';
  SELECT id INTO v_transfers_group FROM public.category_groups WHERE key='transfers';

  -- Create default buckets
  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_income_group, 'Primary Income', 10)
  RETURNING id INTO b_primary_income;

  INSERT INTO public.category_buckets (user_id, group_id, name, sort_order)
  VALUES (v_user, v_expenses_group, 'Housing', 10),
         (v_user, v_expenses_group, 'Transport', 20),
         (v_user, v_expenses_group, 'Groceries', 30)
  RETURNING id INTO b_housing;
  -- The RETURNING id INTO only captures first row; fetch others explicitly
  SELECT id INTO b_transport FROM public.category_buckets 
    WHERE user_id=v_user AND group_id=v_expenses_group AND name='Transport' LIMIT 1;
  SELECT id INTO b_groceries FROM public.category_buckets 
    WHERE user_id=v_user AND group_id=v_expenses_group AND name='Groceries' LIMIT 1;

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

-- Ensure executable by authenticated users
REVOKE ALL ON FUNCTION public.seed_default_categories() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_default_categories() TO authenticated;
