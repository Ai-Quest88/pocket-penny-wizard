-- Add specific rules for Australian toll road operators and fix other mismatched categories
INSERT INTO system_categorization_rules (pattern, category, confidence, country, is_active, conditions) VALUES
-- Australian Toll Road Operators (highest priority)
('linkt', 'Transportation', 0.98, 'AU', true, '{}'),
('eastlink', 'Transportation', 0.98, 'AU', true, '{}'),
('citylink', 'Transportation', 0.98, 'AU', true, '{}'),
('e-tag', 'Transportation', 0.98, 'AU', true, '{}'),
('etag', 'Transportation', 0.98, 'AU', true, '{}'),
('roam express', 'Transportation', 0.98, 'AU', true, '{}'),
('transurban', 'Transportation', 0.98, 'AU', true, '{}'),
('toll road', 'Transportation', 0.95, 'AU', true, '{}'),
('sydney harbour tunnel', 'Transportation', 0.98, 'AU', true, '{}'),

-- Fix Uber Eats specifically (higher confidence than general patterns)
('uber eats', 'Food & Dining', 0.98, 'AU', true, '{}'),
('uber*eats', 'Food & Dining', 0.98, 'AU', true, '{}'),
('ubereats', 'Food & Dining', 0.98, 'AU', true, '{}'),

-- Education and childcare services
('kidsof', 'Other Expenses', 0.95, 'AU', true, '{}'),
('childcare', 'Other Expenses', 0.95, 'AU', true, '{}'),
('kindercare', 'Other Expenses', 0.95, 'AU', true, '{}'),
('school fees', 'Other Expenses', 0.95, 'AU', true, '{}'),

-- Remove the overly broad "interest" pattern that's causing issues
DELETE FROM system_categorization_rules WHERE pattern = 'interest' AND confidence = 0.8;

-- Add more specific interest patterns
INSERT INTO system_categorization_rules (pattern, category, confidence, country, is_active, conditions) VALUES
('bank interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('savings interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('term deposit interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('investment interest', 'Investment Income', 0.95, 'AU', true, '{}');

-- Update the system to prioritize specific patterns over general ones by adjusting confidence
UPDATE system_categorization_rules 
SET confidence = 0.75 
WHERE pattern IN ('direct credit', 'salary', 'wage', 'payroll') 
AND category = 'Salary';