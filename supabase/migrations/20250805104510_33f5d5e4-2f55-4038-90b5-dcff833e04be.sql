-- Update transactions with 'Miscellaneous' category to 'Uncategorized'
UPDATE transactions 
SET category = 'Uncategorized' 
WHERE category = 'Miscellaneous';

-- Update transactions with generic 'Transfer' category to proper transfer categories based on amount
UPDATE transactions 
SET category = CASE 
  WHEN amount > 0 THEN 'Transfer In'
  WHEN amount < 0 THEN 'Transfer Out'
  ELSE 'Internal Transfer'
END
WHERE category = 'Transfer';