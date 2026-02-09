-- Critical Security Fixes

-- 0. Add is_system column to category_groups and categories if missing
ALTER TABLE public.category_groups ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 1. Fix Category Groups RLS Policy - restrict public access to system categories only
DROP POLICY IF EXISTS "Allow public read access to system category groups" ON public.category_groups;

CREATE POLICY "Allow read access to system category groups only"
ON public.category_groups 
FOR SELECT
USING (is_system = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- 2. Secure Audit Log Table - prevent tampering with audit records (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entity_audit_log') THEN
    EXECUTE 'CREATE POLICY "Deny all updates to audit log" ON public.entity_audit_log FOR UPDATE USING (false)';
    EXECUTE 'CREATE POLICY "Deny all deletes from audit log" ON public.entity_audit_log FOR DELETE USING (false)';
  END IF;
END $$;

-- 3. Fix System Rules Conflicting Policies - remove public access (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_categorization_rules') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow public read access to active system categorization rules" ON public.system_categorization_rules';
  END IF;
END $$;