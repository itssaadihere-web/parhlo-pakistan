-- 1. Create a trigger to automatically sync auth.users to public.users
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Secure the SECURITY DEFINER function from public REST executions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;



-- 2. Update RLS policies to allow the Admin to read and write to all tables
-- Admin email is assumed to be parhlo.pakistan.edu@gmail.com

-- This policy applies to public.users
DROP POLICY IF EXISTS "Allow admin all access to users" ON users;
CREATE POLICY "Allow admin all access to users"
ON users FOR ALL
TO authenticated
USING (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

-- This policy applies to public.purchases
DROP POLICY IF EXISTS "Allow admin all access to purchases" ON purchases;
CREATE POLICY "Allow admin all access to purchases"
ON purchases FOR ALL
TO authenticated
USING (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

-- This policy applies to public.courses
DROP POLICY IF EXISTS "Allow admin all access to courses" ON courses;
CREATE POLICY "Allow admin all access to courses"
ON courses FOR ALL
TO authenticated
USING (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK (lower(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');
