
-- Check if there are any users in auth.users and create corresponding profiles
-- This will handle existing users who don't have profiles yet
INSERT INTO public.user_profiles (id, email, full_name, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''),
  au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;
