-- Fix all category-related tables to use consistent foreign key references
-- The AI category system migration created duplicate tables with different schemas
-- This migration ensures all tables use auth.users(id) consistently

-- Fix category_discovery_sessions table
DROP TABLE IF EXISTS category_discovery_sessions CASCADE;

CREATE TABLE category_discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL DEFAULT 'initial',
  transactions_processed INTEGER DEFAULT 0,
  new_categories_created INTEGER DEFAULT 0,
  categories_grouped INTEGER DEFAULT 0,
  ai_confidence_score NUMERIC(3,2) DEFAULT 0.90,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE category_discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discovery sessions" ON category_discovery_sessions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own discovery sessions" ON category_discovery_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own discovery sessions" ON category_discovery_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_category_discovery_sessions_user_id ON category_discovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_category_discovery_sessions_created_at ON category_discovery_sessions(created_at);

-- Fix merchants table
DROP TABLE IF EXISTS merchants CASCADE;

-- Recreate merchants table with correct foreign key reference
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT,
  merchant_patterns TEXT[],
  category_id UUID REFERENCES categories(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchants
CREATE POLICY "Users can view their own merchants" ON merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own merchants" ON merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchants" ON merchants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own merchants" ON merchants FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_normalized_name ON merchants(normalized_name);

-- Add comments
COMMENT ON TABLE merchants IS 'Merchant patterns for transaction categorization';

