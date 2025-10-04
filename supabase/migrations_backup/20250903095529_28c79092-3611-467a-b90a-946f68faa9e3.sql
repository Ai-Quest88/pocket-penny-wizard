-- Remove duplicate categories, keeping only the ones with system = false (user categories)
DELETE FROM categories 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name, user_id ORDER BY is_system ASC, created_at ASC) as rn
    FROM categories
  ) t WHERE rn > 1
);