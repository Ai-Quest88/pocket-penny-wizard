-- Fix RLS policies for financial tables to explicitly restrict to authenticated users only
-- This prevents any potential anonymous access to sensitive financial data

-- Update assets table policies
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can create their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON public.assets;

CREATE POLICY "Authenticated users can view their own assets" 
ON public.assets 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own assets" 
ON public.assets 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own assets" 
ON public.assets 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own assets" 
ON public.assets 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users for assets
CREATE POLICY "Deny all access to anonymous users on assets" 
ON public.assets 
FOR ALL 
TO anon
USING (false);

-- Update liabilities table policies
DROP POLICY IF EXISTS "Users can view their own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can create their own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can update their own liabilities" ON public.liabilities;
DROP POLICY IF EXISTS "Users can delete their own liabilities" ON public.liabilities;

CREATE POLICY "Authenticated users can view their own liabilities" 
ON public.liabilities 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own liabilities" 
ON public.liabilities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own liabilities" 
ON public.liabilities 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own liabilities" 
ON public.liabilities 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users for liabilities
CREATE POLICY "Deny all access to anonymous users on liabilities" 
ON public.liabilities 
FOR ALL 
TO anon
USING (false);

-- Update transactions table policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Authenticated users can view their own transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own transactions" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users for transactions
CREATE POLICY "Deny all access to anonymous users on transactions" 
ON public.transactions 
FOR ALL 
TO anon
USING (false);

-- Update budgets table policies
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Authenticated users can view their own budgets" 
ON public.budgets 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own budgets" 
ON public.budgets 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own budgets" 
ON public.budgets 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own budgets" 
ON public.budgets 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Explicitly deny all access to anonymous users for budgets
CREATE POLICY "Deny all access to anonymous users on budgets" 
ON public.budgets 
FOR ALL 
TO anon
USING (false);