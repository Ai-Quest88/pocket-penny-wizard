-- Update transactions with 'Salary' category to link to the actual salary category
UPDATE transactions 
SET category_id = (
  SELECT c.id 
  FROM categories c 
  JOIN category_buckets cb ON cb.id = c.bucket_id 
  JOIN category_groups cg ON cg.id = cb.group_id 
  WHERE c.name LIKE '%Salary%' 
  AND cg.category_type = 'income'
  LIMIT 1
),
category_name = (
  SELECT c.name 
  FROM categories c 
  JOIN category_buckets cb ON cb.id = c.bucket_id 
  JOIN category_groups cg ON cg.id = cb.group_id 
  WHERE c.name LIKE '%Salary%' 
  AND cg.category_type = 'income'
  LIMIT 1
)
WHERE category_name = 'Salary' AND category_id IS NULL;

-- Update transactions with 'Transfers' category to link to appropriate transfer categories
UPDATE transactions 
SET category_id = (
  SELECT c.id 
  FROM categories c 
  JOIN category_buckets cb ON cb.id = c.bucket_id 
  JOIN category_groups cg ON cg.id = cb.group_id 
  WHERE cg.category_type = 'transfer'
  AND (
    c.merchant_patterns IS NULL 
    OR array_length(c.merchant_patterns, 1) IS NULL
    OR transactions.description ILIKE ANY(c.merchant_patterns)
  )
  LIMIT 1
),
category_name = (
  SELECT c.name 
  FROM categories c 
  JOIN category_buckets cb ON cb.id = c.bucket_id 
  JOIN category_groups cg ON cg.id = cb.group_id 
  WHERE cg.category_type = 'transfer'
  AND (
    c.merchant_patterns IS NULL 
    OR array_length(c.merchant_patterns, 1) IS NULL
    OR transactions.description ILIKE ANY(c.merchant_patterns)
  )
  LIMIT 1
)
WHERE category_name = 'Transfers' AND category_id IS NULL;