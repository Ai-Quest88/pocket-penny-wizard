-- Fix security linter warnings by setting search_path for functions

-- 1. Update validate_entity_access function with proper search_path
CREATE OR REPLACE FUNCTION public.validate_entity_access(entity_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only allow access if the authenticated user matches the entity's user_id
  RETURN auth.uid() = entity_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Update log_entity_update function with proper search_path
CREATE OR REPLACE FUNCTION public.log_entity_update()
RETURNS TRIGGER AS $$
DECLARE
  sensitive_fields TEXT[] := ARRAY['email', 'phone', 'address', 'tax_identifier', 'date_of_birth'];
  accessed_fields TEXT[] := ARRAY[]::TEXT[];
  field_name TEXT;
BEGIN
  -- Check which sensitive fields were accessed/modified
  FOREACH field_name IN ARRAY sensitive_fields
  LOOP
    -- Use a safer approach to check if fields were modified
    IF (TG_OP = 'UPDATE' AND 
        CASE field_name
          WHEN 'email' THEN OLD.email IS DISTINCT FROM NEW.email
          WHEN 'phone' THEN OLD.phone IS DISTINCT FROM NEW.phone
          WHEN 'address' THEN OLD.address IS DISTINCT FROM NEW.address
          WHEN 'tax_identifier' THEN OLD.tax_identifier IS DISTINCT FROM NEW.tax_identifier
          WHEN 'date_of_birth' THEN OLD.date_of_birth IS DISTINCT FROM NEW.date_of_birth
          ELSE FALSE
        END) THEN
      accessed_fields := array_append(accessed_fields, field_name);
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
      NEW.id,
      auth.uid(),
      TG_OP,
      accessed_fields
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;