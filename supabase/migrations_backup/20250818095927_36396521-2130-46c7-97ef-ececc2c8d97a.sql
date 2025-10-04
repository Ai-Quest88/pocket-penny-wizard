-- Delete US-specific retirement categories since Australian equivalents already exist
DELETE FROM public.categories 
WHERE name IN ('401(k)', 'IRA', 'Roth IRA');

-- Delete other US-specific financial categories if Australian equivalents exist
DELETE FROM public.categories 
WHERE name IN ('Mutual Funds', 'Individual Stocks');

-- Update education terminology only if it doesn't conflict
UPDATE public.categories 
SET name = 'Course Fees'
WHERE name = 'Tuition' 
AND NOT EXISTS (
    SELECT 1 FROM public.categories c2 
    WHERE c2.user_id = categories.user_id 
    AND c2.bucket_id = categories.bucket_id 
    AND c2.name = 'Course Fees'
);