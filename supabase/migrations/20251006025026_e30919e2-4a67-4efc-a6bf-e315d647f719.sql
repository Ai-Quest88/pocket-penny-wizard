-- Critical Security Fixes

-- 1. Fix Category Groups RLS Policy - restrict public access to system categories only
DROP POLICY IF EXISTS "Allow public read access to system category groups" ON public.category_groups;

CREATE POLICY "Allow read access to system category groups only"
ON public.category_groups 
FOR SELECT
USING (is_system = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- 2. Secure Audit Log Table - prevent tampering with audit records
CREATE POLICY "Deny all updates to audit log"
ON public.entity_audit_log 
FOR UPDATE
USING (false);

CREATE POLICY "Deny all deletes from audit log"
ON public.entity_audit_log 
FOR DELETE
USING (false);

-- 3. Fix System Rules Conflicting Policies - remove public access
DROP POLICY IF EXISTS "Allow public read access to active system categorization rules" ON public.system_categorization_rules;

-- Keep only the authenticated access policy for system rules
-- The existing "Allow authenticated users to read system rules" policy remains active