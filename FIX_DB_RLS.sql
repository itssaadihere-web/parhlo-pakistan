-- 1. Drop all existing policies on users, purchases, and courses to avoid conflicts or stale policies
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on users
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.users', pol.policyname);
    END LOOP;

    -- Drop all policies on purchases
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'purchases' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.purchases', pol.policyname);
    END LOOP;

    -- Drop all policies on courses
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'courses' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.courses', pol.policyname);
    END LOOP;
END $$;


-- 2. Create clean, correct policies for public.users
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin all access to users"
ON public.users FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow service role all access to users"
ON public.users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 3. Create clean, correct policies for public.purchases
CREATE POLICY "Students can view own purchases"
ON public.purchases FOR SELECT
TO authenticated
USING (student_email = (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email'));

CREATE POLICY "Students can insert own purchases"
ON public.purchases FOR INSERT
TO authenticated
WITH CHECK (student_email = (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email'));

CREATE POLICY "Allow admin all access to purchases"
ON public.purchases FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow service role all access to purchases"
ON public.purchases FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 4. Create clean, correct policies for public.courses
CREATE POLICY "Allow public read access to courses"
ON public.courses FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin all access to courses"
ON public.courses FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow teachers to update own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
      AND public.users.role = 'teacher' 
      AND public.users.full_name = courses.instructor
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE public.users.id = auth.uid() 
      AND public.users.role = 'teacher' 
      AND public.users.full_name = courses.instructor
  )
);

CREATE POLICY "Allow service role write access to courses"
ON public.courses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
