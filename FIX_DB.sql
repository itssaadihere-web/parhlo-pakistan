-- 1. Drop NOT NULL constraints that might be blocking the trigger
ALTER TABLE public.users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS intro TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. Make sure the trigger handles the id properly (in case it's a UUID type, which it should be for auth.uid() = id to work)
-- We will recreate the trigger just in case
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
  );
  RETURN new;
END;
$$;
