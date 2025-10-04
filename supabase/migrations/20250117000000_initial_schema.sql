-- Initial Schema Migration for Pocket Penny Wizard
-- This migration creates the complete database schema for the financial management application

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency_preference TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notification_settings JSONB DEFAULT '{}'::jsonb
);

-- Create entities table
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  tax_identifier TEXT,
  country_of_residence TEXT NOT NULL,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  relationship TEXT,
  date_of_birth DATE,
  registration_number TEXT,
  incorporation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Add household_id to entities
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  entity_id UUID REFERENCES entities(id) NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  account_number TEXT,
  address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  opening_balance_date DATE DEFAULT CURRENT_DATE
);

-- Create liabilities table
CREATE TABLE IF NOT EXISTS liabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  entity_id UUID REFERENCES entities(id) NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  account_number TEXT,
  interest_rate NUMERIC,
  term_months INTEGER,
  monthly_payment NUMERIC,
  opening_balance NUMERIC DEFAULT 0,
  opening_balance_date DATE DEFAULT CURRENT_DATE,
  credit_limit NUMERIC
);

-- Create transactions table (without category_id reference initially)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  category_id UUID, -- Will be updated to reference categories after categories table is created
  category_name TEXT, -- For display purposes and backwards compatibility
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  comment TEXT,
  asset_account_id UUID REFERENCES assets(id),
  liability_account_id UUID REFERENCES liabilities(id)
);

-- Create historical_values table
CREATE TABLE IF NOT EXISTS historical_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  asset_id UUID REFERENCES assets(id),
  liability_id UUID REFERENCES liabilities(id),
  date DATE NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  entity_id UUID REFERENCES entities(id),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for entities
CREATE POLICY "Users can view their own entities" ON entities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own entities" ON entities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own entities" ON entities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own entities" ON entities FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for households
CREATE POLICY "Users can view their own households" ON households FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own households" ON households FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own households" ON households FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own households" ON households FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for assets
CREATE POLICY "Users can view their own assets" ON assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON assets FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for liabilities
CREATE POLICY "Users can view their own liabilities" ON liabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own liabilities" ON liabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own liabilities" ON liabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own liabilities" ON liabilities FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for historical_values
CREATE POLICY "Users can view their own historical values" ON historical_values FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own historical values" ON historical_values FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own historical values" ON historical_values FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own historical values" ON historical_values FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for budgets
CREATE POLICY "Users can view their own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entities_user_id ON entities(user_id);
CREATE INDEX IF NOT EXISTS idx_entities_household_id ON entities(household_id);
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_entity_id ON assets(entity_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_entity_id ON liabilities(entity_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_historical_values_user_id ON historical_values(user_id);
CREATE INDEX IF NOT EXISTS idx_historical_values_date ON historical_values(date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_entities_updated_at 
    BEFORE UPDATE ON entities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at 
    BEFORE UPDATE ON households 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at 
    BEFORE UPDATE ON assets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_liabilities_updated_at 
    BEFORE UPDATE ON liabilities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===== NEW AI-DRIVEN CATEGORY SYSTEM =====

-- Dynamic category groups (AI-generated)
CREATE TABLE IF NOT EXISTS category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category_type TEXT NOT NULL CHECK (category_type IN ('income', 'expense', 'asset', 'liability', 'transfer')),
  description TEXT,
  color TEXT DEFAULT 'bg-blue-100',
  icon TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dynamic category buckets (AI-grouped)
CREATE TABLE IF NOT EXISTS category_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  group_id UUID REFERENCES category_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-blue-200',
  icon TEXT DEFAULT '📂',
  sort_order INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dynamic categories (AI-discovered)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  bucket_id UUID REFERENCES category_buckets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  merchant_patterns TEXT[], -- AI-learned merchant patterns
  is_transfer BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Category discovery sessions (track AI learning)
CREATE TABLE IF NOT EXISTS category_discovery_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  session_type TEXT NOT NULL, -- 'initial', 'batch', 'ongoing'
  transactions_processed INTEGER DEFAULT 0,
  new_categories_created INTEGER DEFAULT 0,
  categories_grouped INTEGER DEFAULT 0,
  ai_confidence_score NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Merchant normalization (AI-learned patterns)
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT,
  category_id UUID REFERENCES categories(id),
  mcc TEXT, -- Merchant Category Code
  country TEXT,
  patterns TEXT[], -- AI-learned transaction patterns
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- RLS policies for category_groups
CREATE POLICY "Users can view their own category groups" ON category_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own category groups" ON category_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own category groups" ON category_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own category groups" ON category_groups FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for category_buckets
CREATE POLICY "Users can view their own category buckets" ON category_buckets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own category buckets" ON category_buckets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own category buckets" ON category_buckets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own category buckets" ON category_buckets FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for categories
CREATE POLICY "Users can view their own categories" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON categories FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for category_discovery_sessions
CREATE POLICY "Users can view their own discovery sessions" ON category_discovery_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own discovery sessions" ON category_discovery_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for merchants
CREATE POLICY "Users can view their own merchants" ON merchants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own merchants" ON merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own merchants" ON merchants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own merchants" ON merchants FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_groups_user_id ON category_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_category_buckets_user_id ON category_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_buckets_group_id ON category_buckets(group_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_bucket_id ON categories(bucket_id);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_category_id ON merchants(category_id);
CREATE INDEX IF NOT EXISTS idx_merchants_normalized_name ON merchants(normalized_name);

-- Triggers for updated_at
CREATE TRIGGER update_category_groups_updated_at 
    BEFORE UPDATE ON category_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_buckets_updated_at 
    BEFORE UPDATE ON category_buckets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at 
    BEFORE UPDATE ON merchants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for transactions.category_id after categories table is created
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_category_id 
FOREIGN KEY (category_id) REFERENCES categories(id); 