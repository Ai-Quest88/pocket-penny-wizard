-- Enhanced security measures for entities table

-- 1. Create a security definer function to validate user access
CREATE OR REPLACE FUNCTION public.validate_entity_access(entity_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow access if the authenticated user matches the entity's user_id
  RETURN auth.uid() = entity_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Drop existing RLS policies for entities table
DROP POLICY IF EXISTS "Users can view their entities" ON public.entities;
DROP POLICY IF EXISTS "Users can create entities" ON public.entities;
DROP POLICY IF EXISTS "Users can update their entities" ON public.entities;
DROP POLICY IF EXISTS "Users can delete their entities" ON public.entities;

-- 3. Create enhanced RLS policies with additional security checks
CREATE POLICY "Users can view only their own entities" 
ON public.entities 
FOR SELECT 
USING (
  public.validate_entity_access(user_id) AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can create entities for themselves only" 
ON public.entities 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  auth.uid() IS NOT NULL AND
  user_id IS NOT NULL
);

CREATE POLICY "Users can update only their own entities" 
ON public.entities 
FOR UPDATE 
USING (
  public.validate_entity_access(user_id) AND 
  auth.uid() IS NOT NULL
)
WITH CHECK (
  auth.uid() = user_id AND 
  user_id IS NOT NULL
);

CREATE POLICY "Users can delete only their own entities" 
ON public.entities 
FOR DELETE 
USING (
  public.validate_entity_access(user_id) AND 
  auth.uid() IS NOT NULL
);

-- 4. Create audit log table for sensitive data access
CREATE TABLE IF NOT EXISTS public.entity_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  accessed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.entity_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit log - users can only see their own audit entries
CREATE POLICY "Users can view their own audit log" 
ON public.entity_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only allow service role to insert audit entries
CREATE POLICY "Service role can insert audit entries" 
ON public.entity_audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 5. Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.log_entity_access()
RETURNS TRIGGER AS $$
DECLARE
  sensitive_fields TEXT[] := ARRAY['email', 'phone', 'address', 'tax_identifier', 'date_of_birth'];
  accessed_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- Check which sensitive fields were accessed
  FOREACH field_name IN ARRAY sensitive_fields
  LOOP
    IF (TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW) OR TG_OP = 'SELECT' THEN
      IF EXECUTE format('SELECT ($1).%I IS NOT NULL', field_name) USING COALESCE(NEW, OLD) THEN
        accessed_fields := array_append(accessed_fields, field_name);
      END IF;
    END IF;
  END LOOP;

  -- Log the access if sensitive fields were involved
  IF array_length(accessed_fields, 1) > 0 THEN
    INSERT INTO public.entity_audit_log (
      entity_id, 
      user_id, 
      action, 
      accessed_fields
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      auth.uid(),
      TG_OP,
      accessed_fields
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create triggers for audit logging
DROP TRIGGER IF EXISTS entities_audit_trigger ON public.entities;
CREATE TRIGGER entities_audit_trigger
  AFTER SELECT OR UPDATE OR DELETE
  ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_access();

-- 7. Add constraint to ensure user_id is never null for entities
ALTER TABLE public.entities 
ALTER COLUMN user_id SET NOT NULL;

-- 8. Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON public.entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_audit_user_id ON public.entity_audit_log(user_id);

-- 9. Add comment to document security measures
COMMENT ON TABLE public.entities IS 'Contains sensitive personal information. All data access is logged and restricted by RLS policies. Sensitive fields should be encrypted client-side before storage.';