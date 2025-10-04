-- Categorize remaining transactions with broader patterns
-- Set default category for remaining uncategorized transactions based on transaction type and amount

-- For remaining positive amounts (income), categorize as Other Income
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Other Income' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND amount > 0
  AND type = 'income';

-- For negative amounts (expenses), try to categorize based on amount ranges and patterns
-- Large amounts might be housing/rent
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Housing' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND amount < -500
  AND type = 'expense';

-- Medium amounts for other expenses
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Other Expenses' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND type = 'expense';

-- Any remaining transfers
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Account Transfer' AND is_system = false LIMIT 1)
WHERE category_id IS NULL 
  AND type = 'transfer';

-- Final catch-all for any remaining transactions
UPDATE transactions 
SET category_id = (SELECT id FROM categories WHERE name = 'Other Expenses' AND is_system = false LIMIT 1)
WHERE category_id IS NULL;