// Script to manually apply the household_entities migration
// This uses the existing Supabase client configuration

const migrationSQL = `
-- Create household_entities junction table for reporting purposes
CREATE TABLE IF NOT EXISTS household_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(household_id, entity_id)
);

-- Add RLS policies
ALTER TABLE household_entities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own household-entity relationships
CREATE POLICY "Users can view their own household entities" ON household_entities
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own household-entity relationships
CREATE POLICY "Users can insert their own household entities" ON household_entities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own household-entity relationships
CREATE POLICY "Users can delete their own household entities" ON household_entities
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_entities_household_id ON household_entities(household_id);
CREATE INDEX IF NOT EXISTS idx_household_entities_entity_id ON household_entities(entity_id);
CREATE INDEX IF NOT EXISTS idx_household_entities_user_id ON household_entities(user_id);
`;

console.log('Migration SQL to apply:');
console.log(migrationSQL);
console.log('\nTo apply this migration:');
console.log('1. Go to your Supabase Dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the SQL above');
console.log('4. Click "Run" to execute the migration');
console.log('\nOr use the Supabase CLI once you have the correct access token:');
console.log('npx supabase db push'); 