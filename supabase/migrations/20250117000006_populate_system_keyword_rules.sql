-- Populate system_keyword_rules with existing patterns from ImprovedHybridCategorizer
-- These rules cover common Australian transaction patterns

INSERT INTO system_keyword_rules (keywords, category_name, confidence, priority) VALUES
  -- Salary & Income (Priority 10 - Highest)
  (ARRAY['salary', 'payroll', 'wage'], 'Salary', 0.95, 10),
  (ARRAY['novel aquatech'], 'Salary', 0.95, 10),
  (ARRAY['direct credit'], 'Salary', 0.90, 10),
  
  -- Food & Dining (Priority 20 - High)
  (ARRAY['uber eats', 'ubereats'], 'Food & Dining', 0.95, 20),
  (ARRAY['woolworths', 'coles', 'aldi', 'iga'], 'Food & Dining', 0.90, 20),
  (ARRAY['restaurant', 'cafe', 'coffee', 'bar'], 'Food & Dining', 0.85, 20),
  (ARRAY['mcdonalds', 'kfc', 'subway', 'pizza'], 'Food & Dining', 0.90, 20),
  
  -- Transportation (Priority 30 - High)
  (ARRAY['linkt', 'eastlink', 'citylink'], 'Transportation', 0.90, 30),
  (ARRAY['uber', 'taxi', 'lyft'], 'Transportation', 0.85, 30),
  (ARRAY['public transport', 'metro', 'bus'], 'Transportation', 0.85, 30),
  
  -- Housing & Utilities (Priority 40 - Medium-High)
  (ARRAY['electricity', 'water', 'gas'], 'Housing', 0.90, 40),
  (ARRAY['rent', 'mortgage'], 'Housing', 0.95, 40),
  (ARRAY['council rates'], 'Housing', 0.90, 40),
  
  -- Healthcare (Priority 50 - Medium-High)
  (ARRAY['cbhs', 'medicare', 'pharmacy'], 'Healthcare', 0.90, 50),
  (ARRAY['hospital', 'doctor', 'medical'], 'Healthcare', 0.85, 50),
  
  -- Account Transfer & Banking (Priority 60 - Medium)
  (ARRAY['bpay', 'transfer to', 'payid'], 'Account Transfer', 0.85, 60),
  (ARRAY['commbank', 'nab', 'anz', 'westpac'], 'Account Transfer', 0.80, 60),
  (ARRAY['atm', 'withdrawal'], 'Account Transfer', 0.80, 60),
  (ARRAY['citibank'], 'Account Transfer', 0.80, 60),
  
  -- Entertainment (Priority 70 - Medium)
  (ARRAY['netflix', 'spotify', 'youtube'], 'Entertainment', 0.90, 70),
  (ARRAY['cinema', 'movie', 'theater'], 'Entertainment', 0.85, 70),
  
  -- Telecommunications (Priority 80 - Medium)
  (ARRAY['more telecom', 'telstra', 'optus', 'vodafone'], 'Telecommunications', 0.90, 80),
  (ARRAY['mobile', 'phone', 'internet'], 'Telecommunications', 0.80, 80),
  
  -- Childcare/Education (Priority 90 - Medium-Low)
  (ARRAY['numero', 'numero pro', 'kidsof'], 'Other Expenses', 0.80, 90),
  
  -- Shopping (Priority 100 - Medium-Low)
  (ARRAY['amazon', 'ebay', 'shopping'], 'Shopping', 0.80, 100),
  (ARRAY['clothing', 'fashion', 'apparel'], 'Shopping', 0.80, 100),
  
  -- Investment & Finance (Priority 110 - Low)
  (ARRAY['investment', 'dividend', 'interest'], 'Investment Income', 0.85, 110),
  (ARRAY['bank interest', 'term deposit'], 'Investment Income', 0.85, 110);

-- Verify the rules were inserted
SELECT COUNT(*) as total_rules, 
       COUNT(*) FILTER (WHERE is_active = true) as active_rules
FROM system_keyword_rules;
