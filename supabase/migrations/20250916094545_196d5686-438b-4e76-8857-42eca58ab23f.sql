-- Enhance security for entities table with additional measures

-- First, let's create a more robust validation function
CREATE OR REPLACE FUNCTION public.validate_entity_access_enhanced(entity_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure user is authenticated and matches entity owner
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF entity_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Only allow access if the authenticated user matches the entity's user_id
  RETURN auth.uid() = entity_user_id;
END;
$$;

-- Drop existing policies to recreate them with enhanced security
DROP POLICY IF EXISTS "Authenticated users can view only their own entities" ON public.entities;
DROP POLICY IF EXISTS "Authenticated users can create entities for themselves" ON public.entities;
DROP POLICY IF EXISTS "Authenticated users can update only their own entities" ON public.entities;
DROP POLICY IF EXISTS "Authenticated users can delete only their own entities" ON public.entities;

-- Create enhanced RLS policies using the security definer function
CREATE POLICY "Enhanced: Users can view only their own entities"
ON public.entities
FOR SELECT
TO authenticated
USING (public.validate_entity_access_enhanced(user_id));

CREATE POLICY "Enhanced: Users can create entities for themselves"
ON public.entities
FOR INSERT
TO authenticated
WITH CHECK (public.validate_entity_access_enhanced(user_id));

CREATE POLICY "Enhanced: Users can update only their own entities"
ON public.entities
FOR UPDATE
TO authenticated
USING (public.validate_entity_access_enhanced(user_id))
WITH CHECK (public.validate_entity_access_enhanced(user_id));

CREATE POLICY "Enhanced: Users can delete only their own entities"
ON public.entities
FOR DELETE
TO authenticated
USING (public.validate_entity_access_enhanced(user_id));

-- Add additional security: Ensure no public access and no anonymous access
REVOKE ALL ON public.entities FROM anon;
REVOKE ALL ON public.entities FROM public;

-- Grant only necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entities TO authenticated;