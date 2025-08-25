-- Update uncategorized transactions with better categorization
UPDATE transactions 
SET category_name = CASE
  WHEN LOWER(description) LIKE '%transfer to%' OR LOWER(description) LIKE '%payid%' OR LOWER(description) LIKE '%commbank app%' THEN 'Transfers'
  WHEN LOWER(description) LIKE '%revenue%' OR LOWER(description) LIKE '%tax%' OR LOWER(description) LIKE '%ato%' THEN 'Government & Tax'
  WHEN LOWER(description) LIKE '%linkt%' OR LOWER(description) LIKE '%toll%' THEN 'Toll Roads'
  WHEN LOWER(description) LIKE '%cbhs%' OR LOWER(description) LIKE '%medicare%' OR LOWER(description) LIKE '%health%' THEN 'Health Insurance'
  WHEN LOWER(description) LIKE '%telstra%' OR LOWER(description) LIKE '%optus%' OR LOWER(description) LIKE '%mobile%' THEN 'Telecommunications'
  WHEN LOWER(description) LIKE '%direct credit%' AND LOWER(description) LIKE '%aquatech%' THEN 'Salary'
  WHEN LOWER(description) LIKE '%woolworths%' OR LOWER(description) LIKE '%coles%' OR LOWER(description) LIKE '%iga%' THEN 'Groceries'
  WHEN LOWER(description) LIKE '%uber eats%' OR LOWER(description) LIKE '%mcdonald%' OR LOWER(description) LIKE '%kfc%' THEN 'Fast Food'
  WHEN LOWER(description) LIKE '%netflix%' OR LOWER(description) LIKE '%spotify%' THEN 'Streaming Services'
  ELSE category_name
END
WHERE category_name = 'Uncategorized';