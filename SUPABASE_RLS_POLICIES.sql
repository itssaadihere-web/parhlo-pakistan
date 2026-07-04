-- Run this exact SQL script in your Supabase SQL Editor to secure your database!

-- 1. Secure the 'courses' table (Public can READ, only Authenticated Admins can INSERT/UPDATE/DELETE, Teachers can update their own courses)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow admin all access to courses" ON courses;
DROP POLICY IF EXISTS "Allow teachers to update own courses" ON courses;
DROP POLICY IF EXISTS "Allow service role write access to courses" ON courses;

CREATE POLICY "Allow public read access to courses"
ON courses FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow admin all access to courses"
ON courses FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow teachers to update own courses"
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
      AND users.role = 'teacher' 
      AND users.full_name = courses.instructor
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
      AND users.role = 'teacher' 
      AND users.full_name = courses.instructor
  )
);

CREATE POLICY "Allow service role write access to courses"
ON courses FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 2. Secure the 'users' table (Users can only READ/UPDATE their own data, Admin has full access)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow admin all access to users" ON users;
DROP POLICY IF EXISTS "Allow service role all access to users" ON users;

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admin all access to users"
ON users FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow service role all access to users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- 3. Secure the 'purchases' table (Students can only see/insert their own purchases, Admin has full access)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Students can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Allow admin all access to purchases" ON purchases;
DROP POLICY IF EXISTS "Allow service role all access to purchases" ON purchases;

CREATE POLICY "Students can view own purchases"
ON purchases FOR SELECT
TO authenticated
USING (student_email = (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email'));

CREATE POLICY "Students can insert own purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (student_email = (coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email'));

CREATE POLICY "Allow admin all access to purchases"
ON purchases FOR ALL
TO authenticated
USING ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com')
WITH CHECK ((coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'email') = 'parhlo.pakistan.edu@gmail.com');

CREATE POLICY "Allow service role all access to purchases"
ON purchases FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
