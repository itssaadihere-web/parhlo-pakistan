-- Run this SQL script in your Supabase SQL Editor to sync existing auth users to the public.users table!
-- This is necessary if teachers were registered before the sync trigger was set up.

INSERT INTO public.users (id, email, full_name, role, intro, image)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
  COALESCE(raw_user_meta_data->>'role', 'student'),
  raw_user_meta_data->>'intro',
  raw_user_meta_data->>'image'
FROM auth.users
ON CONFLICT (email) 
DO UPDATE SET
  id = EXCLUDED.id,
  full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
  role = COALESCE(EXCLUDED.role, public.users.role),
  intro = COALESCE(EXCLUDED.intro, public.users.intro),
  image = COALESCE(EXCLUDED.image, public.users.image);

-- Verify the result
SELECT count(*), role FROM public.users GROUP BY role;
