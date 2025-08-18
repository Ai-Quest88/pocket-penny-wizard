-- Update US-specific retirement categories to Australian equivalents
UPDATE public.categories 
SET name = 'Superannuation'
WHERE name IN ('401(k)', 'IRA', 'Roth IRA');

-- Update any other US-specific financial categories
UPDATE public.categories 
SET name = 'Managed Funds'
WHERE name = 'Mutual Funds';

UPDATE public.categories 
SET name = 'Individual Shares'
WHERE name = 'Individual Stocks';

-- Update healthcare to be more Australian-specific
UPDATE public.categories 
SET name = 'Private Health Insurance'
WHERE name = 'Health Insurance';

-- Update education terminology
UPDATE public.categories 
SET name = 'Course Fees'
WHERE name = 'Tuition';