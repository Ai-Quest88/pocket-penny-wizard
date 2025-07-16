-- Update Transfer transactions based on amount
UPDATE transactions 
SET category = CASE 
  WHEN amount > 0 THEN 'Transfer In' 
  ELSE 'Transfer Out' 
END
WHERE category = 'Transfer';

-- Update Miscellaneous transactions to Uncategorized
UPDATE transactions 
SET category = 'Uncategorized'
WHERE category = 'Miscellaneous';