-- Add unique constraint on entity names per user
-- This prevents users from creating entities with the same name

-- First, remove any existing duplicate names (keep the most recent one)
DELETE FROM entities 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id 
  FROM entities 
  ORDER BY user_id, name, created_at DESC
);

-- Add unique constraint
ALTER TABLE entities 
ADD CONSTRAINT unique_entity_name_per_user 
UNIQUE (user_id, name);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_entities_user_name ON entities(user_id, name); 