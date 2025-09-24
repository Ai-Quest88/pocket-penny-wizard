-- Fix RLS policies for system_categorization_rules table
-- This allows the app to read system categorization rules using the anon key

-- Enable RLS if not already enabled
ALTER TABLE system_categorization_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active system categorization rules" ON system_categorization_rules;

-- Create policy to allow public read access to active system rules
CREATE POLICY "Allow public read access to active system categorization rules"
ON system_categorization_rules
FOR SELECT
USING (is_active = true);

-- Also allow public read access to system categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to system categories" ON categories;

CREATE POLICY "Allow public read access to system categories"
ON categories
FOR SELECT
USING (is_system = true);

-- Allow public read access to category groups for system categories
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to system category groups" ON category_groups;

CREATE POLICY "Allow public read access to system category groups"
ON category_groups
FOR SELECT
USING (true); -- Allow read access to all category groups for now
