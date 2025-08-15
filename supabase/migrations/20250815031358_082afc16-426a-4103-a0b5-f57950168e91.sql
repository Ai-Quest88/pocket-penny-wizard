-- Remove the relationship column from entities table since relationships are now managed through households
ALTER TABLE public.entities DROP COLUMN IF EXISTS relationship;