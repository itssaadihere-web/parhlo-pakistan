-- Recreate the trigger function to handle conflicts if the email already exists in the public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, intro, image)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'intro',
    new.raw_user_meta_data->>'image'
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    id = EXCLUDED.id,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.users.full_name END,
    role = EXCLUDED.role,
    intro = COALESCE(EXCLUDED.intro, public.users.intro),
    image = COALESCE(EXCLUDED.image, public.users.image);
  RETURN new;
END;
$$;
