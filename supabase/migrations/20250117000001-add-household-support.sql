-- Add household support for family finance management
-- This migration adds households table and links individuals to households

-- Create households table
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  primary_contact_id UUID REFERENCES entities(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add household_id column to entities table for individuals
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);

-- Enable RLS on households table
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for households
DO $$ 
BEGIN
    -- Users can view their own households
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'households' AND policyname = 'Users can view their own households') THEN
        CREATE POLICY "Users can view their own households" ON public.households FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Users can create their own households
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'households' AND policyname = 'Users can create their own households') THEN
        CREATE POLICY "Users can create their own households" ON public.households FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Users can update their own households
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'households' AND policyname = 'Users can update their own households') THEN
        CREATE POLICY "Users can update their own households" ON public.households FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Users can delete their own households
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'households' AND policyname = 'Users can delete their own households') THEN
        CREATE POLICY "Users can delete their own households" ON public.households FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_household_id ON entities(household_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_households_updated_at 
    BEFORE UPDATE ON households 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 