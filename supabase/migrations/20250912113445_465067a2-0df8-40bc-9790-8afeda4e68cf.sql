-- Clear existing system rules and insert updated ones that match the category structure
DELETE FROM system_categorization_rules;

-- Insert updated system rules that match the actual categories in the database
INSERT INTO system_categorization_rules (pattern, category, confidence, country, is_active, conditions) VALUES
-- ATM and Cash
('atm', 'Other Expenses', 0.95, 'AU', true, '{}'),
('withdrawal', 'Other Expenses', 0.9, 'AU', true, '{}'),
('wdl atm', 'Other Expenses', 0.95, 'AU', true, '{}'),

-- Transfers
('transfer to', 'Account Transfer', 0.95, 'AU', true, '{}'),
('transfer from', 'Account Transfer', 0.95, 'AU', true, '{}'),
('payid', 'Account Transfer', 0.9, 'AU', true, '{}'),
('bpay', 'Account Transfer', 0.9, 'AU', true, '{}'),

-- Income
('salary', 'Salary', 0.95, 'AU', true, '{}'),
('wage', 'Salary', 0.9, 'AU', true, '{}'),
('payroll', 'Salary', 0.9, 'AU', true, '{}'),
('direct credit', 'Salary', 0.8, 'AU', true, '{}'),
('dividend', 'Investment Income', 0.9, 'AU', true, '{}'),
('interest', 'Investment Income', 0.8, 'AU', true, '{}'),

-- Food delivery services (must come before general transportation)
('uber eats', 'Food & Dining', 0.95, 'AU', true, '{}'),
('ubereats', 'Food & Dining', 0.95, 'AU', true, '{}'),
('deliveroo', 'Food & Dining', 0.95, 'AU', true, '{}'),
('menulog', 'Food & Dining', 0.95, 'AU', true, '{}'),
('doordash', 'Food & Dining', 0.95, 'AU', true, '{}'),

-- Groceries & Supermarkets
('woolworths', 'Food & Dining', 0.95, 'AU', true, '{}'),
('coles', 'Food & Dining', 0.95, 'AU', true, '{}'),
('iga', 'Food & Dining', 0.95, 'AU', true, '{}'),
('aldi', 'Food & Dining', 0.95, 'AU', true, '{}'),
('supermarket', 'Food & Dining', 0.9, 'AU', true, '{}'),

-- Restaurants & Cafes
('mcdonald', 'Food & Dining', 0.9, 'AU', true, '{}'),
('kfc', 'Food & Dining', 0.9, 'AU', true, '{}'),
('starbucks', 'Food & Dining', 0.9, 'AU', true, '{}'),
('coffee', 'Food & Dining', 0.8, 'AU', true, '{}'),
('restaurant', 'Food & Dining', 0.8, 'AU', true, '{}'),
('cafe', 'Food & Dining', 0.8, 'AU', true, '{}'),

-- Fuel & Transportation
('bp ', 'Transportation', 0.95, 'AU', true, '{}'),
('shell', 'Transportation', 0.95, 'AU', true, '{}'),
('caltex', 'Transportation', 0.95, 'AU', true, '{}'),
('ampol', 'Transportation', 0.95, 'AU', true, '{}'),
('petrol', 'Transportation', 0.9, 'AU', true, '{}'),
('fuel', 'Transportation', 0.9, 'AU', true, '{}'),
('uber', 'Transportation', 0.9, 'AU', true, '{}'),
('taxi', 'Transportation', 0.9, 'AU', true, '{}'),

-- Utilities & Housing
('electricity', 'Housing', 0.9, 'AU', true, '{}'),
('water', 'Housing', 0.9, 'AU', true, '{}'),
('gas bill', 'Housing', 0.9, 'AU', true, '{}'),
('internet', 'Housing', 0.8, 'AU', true, '{}'),
('rent', 'Housing', 0.95, 'AU', true, '{}'),
('mortgage', 'Housing', 0.95, 'AU', true, '{}'),

-- Telecommunications
('telstra', 'Housing', 0.9, 'AU', true, '{}'),
('optus', 'Housing', 0.9, 'AU', true, '{}'),
('vodafone', 'Housing', 0.9, 'AU', true, '{}'),
('mobile', 'Housing', 0.8, 'AU', true, '{}'),

-- Healthcare
('medicare', 'Healthcare', 0.95, 'AU', true, '{}'),
('chemist', 'Healthcare', 0.9, 'AU', true, '{}'),
('pharmacy', 'Healthcare', 0.9, 'AU', true, '{}'),
('doctor', 'Healthcare', 0.9, 'AU', true, '{}'),
('medical', 'Healthcare', 0.8, 'AU', true, '{}'),

-- Entertainment
('netflix', 'Entertainment', 0.95, 'AU', true, '{}'),
('spotify', 'Entertainment', 0.95, 'AU', true, '{}'),
('amazon prime', 'Entertainment', 0.9, 'AU', true, '{}'),
('movie', 'Entertainment', 0.8, 'AU', true, '{}'),

-- Shopping
('amazon', 'Shopping', 0.8, 'AU', true, '{}'),
('ebay', 'Shopping', 0.8, 'AU', true, '{}'),
('target', 'Shopping', 0.8, 'AU', true, '{}'),
('kmart', 'Shopping', 0.8, 'AU', true, '{}'),

-- Government & Tax
('ato', 'Other Expenses', 0.95, 'AU', true, '{}'),
('council', 'Other Expenses', 0.9, 'AU', true, '{}'),
('government', 'Other Expenses', 0.8, 'AU', true, '{}'),
('tax office', 'Other Expenses', 0.9, 'AU', true, '{}');