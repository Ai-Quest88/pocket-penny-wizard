-- Add specific rules that don't already exist
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
('uber*eats', 'Food & Dining', 0.98, 'AU', true, '{}'),

-- Education and childcare services
('kidsof', 'Other Expenses', 0.95, 'AU', true, '{}'),
('childcare', 'Other Expenses', 0.95, 'AU', true, '{}'),
('kindercare', 'Other Expenses', 0.95, 'AU', true, '{}'),
('school fees', 'Other Expenses', 0.95, 'AU', true, '{}'),

-- Add more specific interest patterns
('bank interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('savings interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('term deposit interest', 'Investment Income', 0.95, 'AU', true, '{}'),
('investment interest', 'Investment Income', 0.95, 'AU', true, '{}')
ON CONFLICT (pattern, country) DO UPDATE SET
category = EXCLUDED.category,
confidence = EXCLUDED.confidence;