-- Part 1: Move investment buckets to assets group and remove investments group

-- First, move all investment buckets to the assets group
UPDATE public.category_buckets 
SET group_id = (SELECT id FROM public.category_groups WHERE key = 'assets')
WHERE group_id = (SELECT id FROM public.category_groups WHERE key = 'investments');

-- Delete the investments category group
DELETE FROM public.category_groups WHERE key = 'investments';