-- Drop the problematic policies that might be causing a "Bad Request" error
DROP POLICY IF EXISTS "Allow admin all access to users" ON public.users;
DROP POLICY IF EXISTS "Allow admin all access to purchases" ON public.purchases;

-- Recreate them using a subquery (which is known to work on your database version)
CREATE POLICY "Allow admin all access to users"
ON public.users FOR ALL
TO authenticated
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow admin all access to purchases"
ON public.purchases FOR ALL
TO authenticated
USING ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((SELECT email FROM auth.users WHERE id = auth.uid()) = 'parhlo.pakistan.edu@gmail.com');
