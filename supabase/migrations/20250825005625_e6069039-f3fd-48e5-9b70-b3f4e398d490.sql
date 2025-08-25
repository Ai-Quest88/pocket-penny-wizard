-- Clean up duplicate category groups for the user
-- Keep only the oldest entry for each unique combination of user_id, name, and category_type

-- First, delete associated category buckets and categories for duplicate groups
DELETE FROM categories 
WHERE bucket_id IN (
  SELECT cb.id 
  FROM category_buckets cb
  JOIN category_groups cg ON cb.group_id = cg.id
  WHERE cg.user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
  AND cg.id NOT IN (
    -- Keep the oldest group for each unique combination
    SELECT DISTINCT ON (name, category_type) id
    FROM category_groups
    WHERE user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
    ORDER BY name, category_type, created_at ASC
  )
);

-- Delete associated category buckets for duplicate groups
DELETE FROM category_buckets 
WHERE group_id IN (
  SELECT id 
  FROM category_groups
  WHERE user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
  AND id NOT IN (
    -- Keep the oldest group for each unique combination
    SELECT DISTINCT ON (name, category_type) id
    FROM category_groups
    WHERE user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
    ORDER BY name, category_type, created_at ASC
  )
);

-- Delete duplicate category groups (keep only the oldest for each unique combination)
DELETE FROM category_groups 
WHERE user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
AND id NOT IN (
  -- Keep the oldest group for each unique combination
  SELECT DISTINCT ON (name, category_type) id
  FROM category_groups
  WHERE user_id = '1de7a2af-fad1-4857-87f8-b9ba2149139a'
  ORDER BY name, category_type, created_at ASC
);