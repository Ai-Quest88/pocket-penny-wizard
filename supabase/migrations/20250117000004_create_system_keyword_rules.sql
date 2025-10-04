-- Create system_keyword_rules table for Smart Categorization System
-- This table stores database-driven keyword rules for common transaction patterns

CREATE TABLE IF NOT EXISTS system_keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords TEXT[] NOT NULL,
  category_name TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_keyword_rules_keywords ON system_keyword_rules 
USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_system_keyword_rules_active ON system_keyword_rules 
(is_active, priority) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_system_keyword_rules_category ON system_keyword_rules 
(category_name) WHERE is_active = true;

-- Enable RLS
ALTER TABLE system_keyword_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access to active system rules
CREATE POLICY "Public can read active system keyword rules" ON system_keyword_rules 
FOR SELECT USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_keyword_rules_updated_at 
    BEFORE UPDATE ON system_keyword_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
