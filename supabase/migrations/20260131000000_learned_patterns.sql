-- Learned merchant patterns from user corrections
-- This enables the learning system to improve categorization accuracy over time

CREATE TABLE IF NOT EXISTS learned_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,           -- Normalized merchant/description pattern
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,     -- Denormalized for quick lookups
  match_count INTEGER DEFAULT 1,   -- How many times this pattern matched
  last_matched_at TIMESTAMPTZ,     -- When pattern was last used
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern)
);

-- Indexes for fast pattern lookup
CREATE INDEX IF NOT EXISTS idx_learned_patterns_user_id ON learned_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_pattern ON learned_patterns(pattern);
CREATE INDEX IF NOT EXISTS idx_learned_patterns_category ON learned_patterns(category_name);

-- Enable RLS
ALTER TABLE learned_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own patterns
CREATE POLICY "Users can view their own learned patterns" 
  ON learned_patterns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own learned patterns" 
  ON learned_patterns FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learned patterns" 
  ON learned_patterns FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learned patterns" 
  ON learned_patterns FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_learned_patterns_updated_at 
  BEFORE UPDATE ON learned_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to save/update a learned pattern
CREATE OR REPLACE FUNCTION save_learned_pattern(
  p_user_id UUID,
  p_description TEXT,
  p_category_name TEXT,
  p_category_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_pattern TEXT;
  v_pattern_id UUID;
BEGIN
  -- Normalize the description to create a pattern
  v_pattern := lower(regexp_replace(p_description, '[0-9]+', '', 'g'));
  v_pattern := trim(regexp_replace(v_pattern, '\s+', ' ', 'g'));
  
  -- Upsert the pattern
  INSERT INTO learned_patterns (user_id, pattern, category_name, category_id, match_count, last_matched_at)
  VALUES (p_user_id, v_pattern, p_category_name, p_category_id, 1, NOW())
  ON CONFLICT (user_id, pattern) 
  DO UPDATE SET 
    category_name = EXCLUDED.category_name,
    category_id = EXCLUDED.category_id,
    match_count = learned_patterns.match_count + 1,
    last_matched_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_pattern_id;
  
  RETURN v_pattern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find matching pattern for a description
CREATE OR REPLACE FUNCTION find_learned_pattern(
  p_user_id UUID,
  p_description TEXT
) RETURNS TABLE (
  pattern_id UUID,
  category_name TEXT,
  category_id UUID,
  confidence NUMERIC
) AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  -- Normalize the description
  v_normalized := lower(regexp_replace(p_description, '[0-9]+', '', 'g'));
  v_normalized := trim(regexp_replace(v_normalized, '\s+', ' ', 'g'));
  
  RETURN QUERY
  SELECT 
    lp.id,
    lp.category_name,
    lp.category_id,
    CASE 
      WHEN lp.pattern = v_normalized THEN 0.98
      WHEN v_normalized LIKE '%' || lp.pattern || '%' THEN 0.95
      WHEN lp.pattern LIKE '%' || v_normalized || '%' THEN 0.92
      ELSE 0.85
    END AS confidence
  FROM learned_patterns lp
  WHERE lp.user_id = p_user_id
    AND (
      lp.pattern = v_normalized
      OR v_normalized LIKE '%' || lp.pattern || '%'
      OR lp.pattern LIKE '%' || v_normalized || '%'
    )
  ORDER BY 
    (lp.pattern = v_normalized) DESC,
    length(lp.pattern) DESC,
    lp.match_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION save_learned_pattern TO authenticated;
GRANT EXECUTE ON FUNCTION find_learned_pattern TO authenticated;




