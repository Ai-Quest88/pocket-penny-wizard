-- Add categorization tracking columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS categorization_source text,
ADD COLUMN IF NOT EXISTS categorization_confidence decimal(3,2);

-- Create system_keyword_rules table for centralized keyword patterns
CREATE TABLE IF NOT EXISTS system_keyword_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords text[] NOT NULL,
  category_name text NOT NULL,
  confidence decimal(3,2) NOT NULL DEFAULT 0.80,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on system_keyword_rules (read-only for authenticated users)
ALTER TABLE system_keyword_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system keyword rules"
ON system_keyword_rules FOR SELECT
TO authenticated
USING (true);

-- Insert some common keyword rules for immediate functionality
INSERT INTO system_keyword_rules (keywords, category_name, confidence, priority) VALUES
  (ARRAY['woolworths', 'coles', 'aldi', 'iga', 'grocery'], 'Groceries', 0.90, 10),
  (ARRAY['uber', 'taxi', 'lyft', 'transport', 'train', 'bus'], 'Transportation', 0.85, 20),
  (ARRAY['restaurant', 'cafe', 'coffee', 'dining', 'food', 'mcdonald', 'kfc'], 'Food & Dining', 0.85, 30),
  (ARRAY['salary', 'wages', 'payroll', 'income'], 'Salary', 0.95, 5),
  (ARRAY['rent', 'mortgage', 'housing', 'lease'], 'Housing', 0.90, 15),
  (ARRAY['electricity', 'gas', 'water', 'utility', 'utilities'], 'Utilities', 0.90, 25),
  (ARRAY['transfer', 'payment to', 'payment from'], 'Account Transfer', 0.80, 50),
  (ARRAY['telstra', 'optus', 'vodafone', 'internet', 'phone', 'mobile'], 'Telecommunications', 0.85, 35),
  (ARRAY['medical', 'doctor', 'hospital', 'pharmacy', 'health'], 'Healthcare', 0.85, 40),
  (ARRAY['amazon', 'ebay', 'shopping', 'retail'], 'Shopping', 0.75, 60)
ON CONFLICT DO NOTHING;