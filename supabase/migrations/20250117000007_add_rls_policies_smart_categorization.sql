-- Add RLS policies for Smart Categorization System
-- Ensure proper access control for the new system

-- Additional RLS policy for system_keyword_rules (if not already created)
-- This allows authenticated users to read system rules
CREATE POLICY "Authenticated users can read system keyword rules" ON system_keyword_rules 
FOR SELECT USING (is_active = true);

-- Ensure transactions table has proper RLS for categorization columns
-- The existing RLS policies should already cover these new columns
-- But let's verify and add any missing policies

-- Create a policy to allow users to update their own transaction categorization metadata
CREATE POLICY "Users can update their own transaction categorization" ON transactions 
FOR UPDATE USING (auth.uid() = user_id);

-- Create a policy to allow users to insert transactions with categorization metadata
CREATE POLICY "Users can insert transactions with categorization metadata" ON transactions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify all policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('system_keyword_rules', 'transactions')
ORDER BY tablename, policyname;
