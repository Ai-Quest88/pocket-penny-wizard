
-- First, let's check what data exists and what user_ids are set
SELECT 'entities' as table_name, COUNT(*) as total_rows, 
       COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id,
       COUNT(CASE WHEN user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee' THEN 1 END) as rows_for_current_user
FROM public.entities
UNION ALL
SELECT 'assets' as table_name, COUNT(*) as total_rows,
       COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id,
       COUNT(CASE WHEN user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee' THEN 1 END) as rows_for_current_user
FROM public.assets
UNION ALL
SELECT 'liabilities' as table_name, COUNT(*) as total_rows,
       COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as rows_with_user_id,
       COUNT(CASE WHEN user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee' THEN 1 END) as rows_for_current_user
FROM public.liabilities;

-- Now let's update any remaining records that might not have been caught
-- Force update all records to the current user ID regardless of their current state
UPDATE public.entities SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
UPDATE public.assets SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
UPDATE public.liabilities SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
UPDATE public.budgets SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
UPDATE public.historical_values SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
UPDATE public.transactions SET user_id = '3ae547db-1675-48ff-b9af-03db6177d8ee';
