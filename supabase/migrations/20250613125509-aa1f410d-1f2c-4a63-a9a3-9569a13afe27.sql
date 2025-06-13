
-- Check and create RLS policies only if they don't exist

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    -- Enable RLS on assets table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'assets' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on liabilities table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'liabilities' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on entities table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'entities' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on budgets table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'budgets' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on transactions table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'transactions' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on historical_values table if not enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'historical_values' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.historical_values ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for liabilities if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'liabilities' AND policyname = 'Users can view their own liabilities') THEN
        CREATE POLICY "Users can view their own liabilities" ON public.liabilities FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'liabilities' AND policyname = 'Users can create their own liabilities') THEN
        CREATE POLICY "Users can create their own liabilities" ON public.liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'liabilities' AND policyname = 'Users can update their own liabilities') THEN
        CREATE POLICY "Users can update their own liabilities" ON public.liabilities FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'liabilities' AND policyname = 'Users can delete their own liabilities') THEN
        CREATE POLICY "Users can delete their own liabilities" ON public.liabilities FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for entities if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entities' AND policyname = 'Users can view their own entities') THEN
        CREATE POLICY "Users can view their own entities" ON public.entities FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entities' AND policyname = 'Users can create their own entities') THEN
        CREATE POLICY "Users can create their own entities" ON public.entities FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entities' AND policyname = 'Users can update their own entities') THEN
        CREATE POLICY "Users can update their own entities" ON public.entities FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entities' AND policyname = 'Users can delete their own entities') THEN
        CREATE POLICY "Users can delete their own entities" ON public.entities FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for budgets if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets' AND policyname = 'Users can view their own budgets') THEN
        CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets' AND policyname = 'Users can create their own budgets') THEN
        CREATE POLICY "Users can create their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets' AND policyname = 'Users can update their own budgets') THEN
        CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets' AND policyname = 'Users can delete their own budgets') THEN
        CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for transactions if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can view their own transactions') THEN
        CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can create their own transactions') THEN
        CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can update their own transactions') THEN
        CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Users can delete their own transactions') THEN
        CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create policies for historical_values if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historical_values' AND policyname = 'Users can view their own historical_values') THEN
        CREATE POLICY "Users can view their own historical_values" ON public.historical_values FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historical_values' AND policyname = 'Users can create their own historical_values') THEN
        CREATE POLICY "Users can create their own historical_values" ON public.historical_values FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historical_values' AND policyname = 'Users can update their own historical_values') THEN
        CREATE POLICY "Users can update their own historical_values" ON public.historical_values FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'historical_values' AND policyname = 'Users can delete their own historical_values') THEN
        CREATE POLICY "Users can delete their own historical_values" ON public.historical_values FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
