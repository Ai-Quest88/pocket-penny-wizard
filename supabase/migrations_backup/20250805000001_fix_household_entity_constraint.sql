-- Fix household-entity foreign key constraint to allow household deletion
-- This migration modifies the foreign key constraint to use ON DELETE SET NULL
-- so that when a household is deleted, entities' household_id is set to NULL

-- First, drop the existing foreign key constraint
ALTER TABLE entities 
DROP CONSTRAINT IF EXISTS entities_household_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE entities 
ADD CONSTRAINT entities_household_id_fkey 
FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL; 