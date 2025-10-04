-- More comprehensive duplicate removal - keep the first occurrence of each category name per user
WITH duplicate_categories AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY name, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid) 
           ORDER BY 
             CASE WHEN is_system THEN 1 ELSE 0 END ASC,  -- Prefer user categories over system
             created_at ASC
         ) as rn
  FROM categories
)
DELETE FROM categories 
WHERE id IN (
  SELECT id FROM duplicate_categories WHERE rn > 1
);