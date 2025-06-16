
-- Get the current authenticated user's ID and update all existing records
-- This will associate all existing data with the currently logged-in user (admin@example.com)

-- Update entities table
UPDATE public.entities 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());

-- Update assets table  
UPDATE public.assets 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());

-- Update liabilities table
UPDATE public.liabilities 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());

-- Update budgets table
UPDATE public.budgets 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());

-- Update historical_values table
UPDATE public.historical_values 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());

-- Update transactions table
UPDATE public.transactions 
SET user_id = (SELECT auth.uid())
WHERE user_id IS NULL OR user_id != (SELECT auth.uid());
