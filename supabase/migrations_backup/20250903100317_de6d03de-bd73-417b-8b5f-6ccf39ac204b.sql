-- Re-categorize transactions based on description patterns using existing categories
-- First, let's update transactions with clear category matches

-- Salary/Income transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Salary' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%salary%' OR description ILIKE '%wage%' OR description ILIKE '%pay%' OR description ILIKE '%income%')
  AND amount > 0;

-- Grocery transactions  
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Food & Dining' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%grocery%' OR description ILIKE '%supermarket%' OR description ILIKE '%coles%' OR description ILIKE '%woolworths%');

-- Transport/Fuel transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Transportation' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%fuel%' OR description ILIKE '%petrol%' OR description ILIKE '%gas%' OR description ILIKE '%bp%' OR description ILIKE '%caltex%' OR description ILIKE '%transport%' OR description ILIKE '%taxi%' OR description ILIKE '%uber%');

-- Housing/Utilities transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Housing' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%rent%' OR description ILIKE '%mortgage%' OR description ILIKE '%utilities%' OR description ILIKE '%electricity%' OR description ILIKE '%water%' OR description ILIKE '%internet%');

-- Shopping transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Shopping' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%shop%' OR description ILIKE '%store%' OR description ILIKE '%retail%' OR description ILIKE '%clothing%');

-- Transfer transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Account Transfer' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND (description ILIKE '%transfer%' OR description ILIKE '%p2p%' OR type = 'transfer');