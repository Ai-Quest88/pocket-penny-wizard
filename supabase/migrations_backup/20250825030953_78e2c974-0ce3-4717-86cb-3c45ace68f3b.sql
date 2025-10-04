-- Fix RLS policies for user_profiles table to prevent anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create new policies that explicitly restrict to authenticated users only
CREATE POLICY "Authenticated users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Explicitly deny all access to anonymous users
CREATE POLICY "Deny all access to anonymous users" 
ON public.user_profiles 
FOR ALL 
TO anon
USING (false);