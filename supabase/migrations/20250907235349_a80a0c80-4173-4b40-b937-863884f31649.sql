-- Fix the entities table RLS policies to prevent any unauthenticated access
-- and ensure complete data protection

-- First, drop the existing policies
DROP POLICY IF EXISTS "Users can view only their own entities" ON public.entities;
DROP POLICY IF EXISTS "Users can create entities for themselves only" ON public.entities;
DROP POLICY IF EXISTS "Users can update only their own entities" ON public.entities;
DROP POLICY IF EXISTS "Users can delete only their own entities" ON public.entities;

-- Create more restrictive policies that completely block unauthenticated access

-- SELECT policy: Only authenticated users can view their own entities
CREATE POLICY "Authenticated users can view only their own entities" 
ON public.entities 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- INSERT policy: Only authenticated users can create entities for themselves
CREATE POLICY "Authenticated users can create entities for themselves" 
ON public.entities 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- UPDATE policy: Only authenticated users can update their own entities
CREATE POLICY "Authenticated users can update only their own entities" 
ON public.entities 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- DELETE policy: Only authenticated users can delete their own entities
CREATE POLICY "Authenticated users can delete only their own entities" 
ON public.entities 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- Ensure the user_id column cannot be null to prevent data without owner
ALTER TABLE public.entities ALTER COLUMN user_id SET NOT NULL;