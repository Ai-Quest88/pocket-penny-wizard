-- First, remove the problematic broad "interest" pattern
DELETE FROM system_categorization_rules WHERE pattern = 'interest' AND confidence = 0.8;