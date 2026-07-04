-- Drop the problematic policies that cause a "Bad Request" error
DROP POLICY IF EXISTS "Allow admin all access to users" ON public.users;
DROP POLICY IF EXISTS "Allow admin all access to purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow admin all access to courses" ON public.courses;

-- Recreate them using current_setting which avoids private auth.users table permissions and auth.jwt() function availability issues
CREATE POLICY "Allow admin all access to users"
ON public.users FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow admin all access to purchases"
ON public.purchases FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow admin all access to courses"
ON public.courses FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');
