-- Migration: AI-Driven Category System
-- Date: 2025-01-18
-- Description: Implements new AI-driven category discovery and management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create category_groups table
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'folder',
    sort_order INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create category_buckets table
CREATE TABLE IF NOT EXISTS category_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(50) DEFAULT 'folder-open',
    sort_order INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES category_buckets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    merchant_patterns TEXT[],
    is_transfer BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create category_discovery_sessions table
CREATE TABLE IF NOT EXISTS category_discovery_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL,
    transactions_processed INTEGER DEFAULT 0,
    new_categories_created INTEGER DEFAULT 0,
    categories_grouped INTEGER DEFAULT 0,
    ai_confidence_score DECIMAL(3,2) DEFAULT 0.0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    normalized_name VARCHAR(200),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    mcc VARCHAR(10),
    country VARCHAR(2) DEFAULT 'AU',
    patterns TEXT[],
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_groups_user_id ON category_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_category_buckets_user_id ON category_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_category_buckets_group_id ON category_buckets(group_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_bucket_id ON categories(bucket_id);
CREATE INDEX IF NOT EXISTS idx_categories_merchant_patterns ON categories USING GIN(merchant_patterns);
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_category_id ON merchants(category_id);
CREATE INDEX IF NOT EXISTS idx_merchants_normalized_name ON merchants(normalized_name);

-- Create RLS policies
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- RLS Policy for category_groups
CREATE POLICY "Users can view their own category groups" ON category_groups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category groups" ON category_groups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category groups" ON category_groups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category groups" ON category_groups
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy for category_buckets
CREATE POLICY "Users can view their own category buckets" ON category_buckets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own category buckets" ON category_buckets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category buckets" ON category_buckets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category buckets" ON category_buckets
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy for categories
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policy for category_discovery_sessions
CREATE POLICY "Users can view their own discovery sessions" ON category_discovery_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discovery sessions" ON category_discovery_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy for merchants
CREATE POLICY "Users can view their own merchants" ON merchants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own merchants" ON merchants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own merchants" ON merchants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own merchants" ON merchants
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
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

-- Insert default category structure for new users
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS void AS $$
DECLARE
    user_id UUID;
    income_group_id UUID;
    expense_group_id UUID;
    asset_group_id UUID;
    liability_group_id UUID;
    transfer_group_id UUID;
BEGIN
    -- Get the current user ID from auth context
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Create default category groups
    INSERT INTO category_groups (user_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, 'Income', 'Money coming in', '#10B981', 'trending-up', 1, false),
        (user_id, 'Expenses', 'Money going out', '#EF4444', 'trending-down', 2, false),
        (user_id, 'Assets', 'Things you own', '#3B82F6', 'briefcase', 3, false),
        (user_id, 'Liabilities', 'Things you owe', '#F59E0B', 'credit-card', 4, false),
        (user_id, 'Transfers', 'Moving money between accounts', '#8B5CF6', 'repeat', 5, false)
    RETURNING id INTO income_group_id;
    
    -- Get all group IDs
    SELECT id INTO income_group_id FROM category_groups WHERE user_id = user_id AND name = 'Income' LIMIT 1;
    SELECT id INTO expense_group_id FROM category_groups WHERE user_id = user_id AND name = 'Expenses' LIMIT 1;
    SELECT id INTO asset_group_id FROM category_groups WHERE user_id = user_id AND name = 'Assets' LIMIT 1;
    SELECT id INTO liability_group_id FROM category_groups WHERE user_id = user_id AND name = 'Liabilities' LIMIT 1;
    SELECT id INTO transfer_group_id FROM category_groups WHERE user_id = user_id AND name = 'Transfers' LIMIT 1;
    
    -- Create default buckets and categories
    -- Income buckets
    INSERT INTO category_buckets (user_id, group_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, income_group_id, 'Employment', 'Salary and wages', '#10B981', 'briefcase', 1, false),
        (user_id, income_group_id, 'Business', 'Business income', '#059669', 'building', 2, false),
        (user_id, income_group_id, 'Investment', 'Investment returns', '#047857', 'chart-line', 3, false);
    
    -- Expense buckets
    INSERT INTO category_buckets (user_id, group_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, expense_group_id, 'Housing', 'Housing costs', '#EF4444', 'home', 1, false),
        (user_id, expense_group_id, 'Transport', 'Transportation costs', '#DC2626', 'car', 2, false),
        (user_id, expense_group_id, 'Food', 'Food and dining', '#B91C1C', 'utensils', 3, false),
        (user_id, expense_group_id, 'Entertainment', 'Entertainment and leisure', '#991B1B', 'film', 4, false);
    
    -- Asset buckets
    INSERT INTO category_buckets (user_id, group_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, asset_group_id, 'Bank Accounts', 'Bank account balances', '#3B82F6', 'credit-card', 1, false),
        (user_id, asset_group_id, 'Investments', 'Investment accounts', '#2563EB', 'trending-up', 2, false),
        (user_id, asset_group_id, 'Property', 'Real estate', '#1D4ED8', 'home', 3, false);
    
    -- Liability buckets
    INSERT INTO category_buckets (user_id, group_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, liability_group_id, 'Credit Cards', 'Credit card debt', '#F59E0B', 'credit-card', 1, false),
        (user_id, liability_group_id, 'Loans', 'Personal and business loans', '#D97706', 'file-text', 2, false),
        (user_id, liability_group_id, 'Mortgages', 'Property mortgages', '#B45309', 'home', 3, false);
    
    -- Transfer buckets
    INSERT INTO category_buckets (user_id, group_id, name, description, color, icon, sort_order, is_ai_generated)
    VALUES 
        (user_id, transfer_group_id, 'Internal', 'Between your accounts', '#8B5CF6', 'repeat', 1, false),
        (user_id, transfer_group_id, 'External', 'To other people', '#7C3AED', 'share', 2, false);
    
    RAISE NOTICE 'Default categories created for user %', user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION seed_default_categories() TO authenticated;
