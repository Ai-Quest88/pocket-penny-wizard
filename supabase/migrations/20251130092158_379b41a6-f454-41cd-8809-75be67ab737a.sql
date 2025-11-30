-- Phase 1: AI CFO Database Schema
-- Create tables for Personal AI CFO knowledge system

-- 1. User Financial Profile - AI's persistent memory
CREATE TABLE IF NOT EXISTS user_financial_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  
  -- AI's compiled knowledge document (JSON)
  knowledge_document JSONB NOT NULL DEFAULT '{}',
  
  -- Financial personality & preferences
  risk_tolerance TEXT DEFAULT 'moderate',
  spending_personality TEXT,
  financial_goals_summary TEXT,
  
  -- Behavioral patterns (AI learns these)
  typical_monthly_income NUMERIC,
  typical_monthly_expenses NUMERIC,
  preferred_savings_rate NUMERIC,
  
  -- CFO relationship tracking
  total_transactions_analyzed INTEGER DEFAULT 0,
  corrections_count INTEGER DEFAULT 0,
  accuracy_score NUMERIC DEFAULT 0.0,
  last_advice_given JSONB,
  
  -- Timestamps
  last_compiled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Merchant Mappings - Learned merchant preferences
CREATE TABLE IF NOT EXISTS user_merchant_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  merchant_pattern TEXT NOT NULL,
  normalized_name TEXT,
  preferred_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  times_used INTEGER DEFAULT 1,
  times_confirmed INTEGER DEFAULT 0,
  average_amount NUMERIC,
  typical_frequency TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, merchant_pattern)
);

-- 3. User Financial Goals - Goals tracking
CREATE TABLE IF NOT EXISTS user_financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date DATE,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Category Corrections - Learning from corrections
CREATE TABLE IF NOT EXISTS user_category_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  original_category TEXT,
  corrected_category TEXT NOT NULL,
  merchant_pattern TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CFO Alerts - Proactive AI alerts
CREATE TABLE IF NOT EXISTS cfo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add optional columns to transactions (backward compatible)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS user_corrected BOOLEAN DEFAULT FALSE;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS original_ai_category_id UUID;

-- Enable RLS on all new tables
ALTER TABLE user_financial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_financial_profile
CREATE POLICY "Users can view their own financial profile"
  ON user_financial_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial profile"
  ON user_financial_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial profile"
  ON user_financial_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_merchant_mappings
CREATE POLICY "Users can view their own merchant mappings"
  ON user_merchant_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchant mappings"
  ON user_merchant_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchant mappings"
  ON user_merchant_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchant mappings"
  ON user_merchant_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_financial_goals
CREATE POLICY "Users can view their own goals"
  ON user_financial_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON user_financial_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON user_financial_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON user_financial_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_category_corrections
CREATE POLICY "Users can view their own corrections"
  ON user_category_corrections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own corrections"
  ON user_category_corrections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cfo_alerts
CREATE POLICY "Users can view their own alerts"
  ON cfo_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON cfo_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON cfo_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_financial_profile_user_id ON user_financial_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_merchant_mappings_user_id ON user_merchant_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_merchant_mappings_pattern ON user_merchant_mappings(user_id, merchant_pattern);
CREATE INDEX IF NOT EXISTS idx_user_financial_goals_user_id ON user_financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_financial_goals_status ON user_financial_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_category_corrections_user_id ON user_category_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_user_id ON cfo_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_cfo_alerts_unread ON cfo_alerts(user_id, is_read, is_dismissed);

-- Add trigger for updating user_financial_goals updated_at
CREATE OR REPLACE FUNCTION update_financial_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_financial_goals_updated_at
    BEFORE UPDATE ON user_financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_goals_updated_at();