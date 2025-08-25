-- Fix the specific uncategorized transactions from recent upload
UPDATE transactions 
SET category_name = CASE
  WHEN LOWER(description) = 'grocery store' THEN 'Groceries'
  WHEN LOWER(description) = 'gas station' THEN 'Fuel'
  ELSE category_name
END
WHERE category_name = 'Uncategorized' 
  AND (LOWER(description) = 'grocery store' OR LOWER(description) = 'gas station');