-- Add category_type to system_keyword_rules
ALTER TABLE system_keyword_rules 
ADD COLUMN IF NOT EXISTS category_type text CHECK (category_type IN ('income', 'expense', 'transfer', 'asset', 'liability'));

-- Clear existing rules and re-insert with correct types
DELETE FROM system_keyword_rules;

-- Insert keyword rules with correct category types
INSERT INTO system_keyword_rules (keywords, category_name, category_type, confidence, priority) VALUES
  -- Income rules
  (ARRAY['salary', 'wages', 'payroll', 'income'], 'Salary', 'income', 0.95, 5),
  
  -- Expense rules
  (ARRAY['woolworths', 'coles', 'aldi', 'iga', 'grocery'], 'Food & Dining', 'expense', 0.90, 10),
  (ARRAY['rent', 'mortgage', 'housing', 'lease'], 'Housing', 'expense', 0.90, 15),
  (ARRAY['uber', 'taxi', 'lyft', 'transport', 'train', 'bus'], 'Transportation', 'expense', 0.85, 20),
  (ARRAY['electricity', 'gas', 'water', 'utility', 'utilities'], 'Housing', 'expense', 0.90, 25),
  (ARRAY['restaurant', 'cafe', 'coffee', 'dining', 'food', 'mcdonald', 'kfc'], 'Food & Dining', 'expense', 0.85, 30),
  (ARRAY['telstra', 'optus', 'vodafone', 'internet', 'phone', 'mobile'], 'Housing', 'expense', 0.85, 35),
  (ARRAY['medical', 'doctor', 'hospital', 'pharmacy', 'health'], 'Healthcare', 'expense', 0.85, 40),
  (ARRAY['amazon', 'ebay', 'shopping', 'retail'], 'Shopping', 'expense', 0.75, 60),
  (ARRAY['cash withdrawal', 'atm', 'cash out'], 'Cash Withdrawal', 'expense', 0.90, 45),
  
  -- Transfer rules
  (ARRAY['transfer', 'payment to', 'payment from'], 'Account Transfer', 'transfer', 0.80, 50);