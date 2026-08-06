-- ==============================================================================
-- PARHLO PAKISTAN - CONSOLIDATED MASTER DATABASE SETUP SCRIPT
-- Run this ENTIRE script in your NEW Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create 'users' table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'student', -- 'student', 'teacher', 'sales', 'admin'
  phone TEXT,
  intro TEXT,
  image TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'courses' table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  level TEXT DEFAULT 'All Levels',
  category TEXT DEFAULT 'General',
  instructor TEXT,
  instructorIntro TEXT,
  instructorImage TEXT,
  thumbnail TEXT,
  price TEXT DEFAULT '0',
  discount TEXT DEFAULT '0',
  students TEXT DEFAULT '0',
  rating NUMERIC DEFAULT 5.0,
  tag TEXT DEFAULT 'Featured',
  lectures JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'purchases' table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'suspended'
  payment_screenshot_url TEXT,
  payment_plan TEXT DEFAULT 'full', -- 'full', 'installment', 'free_trial'
  installments_paid INT DEFAULT 1,
  monthly_installment_amount NUMERIC,
  total_price NUMERIC,
  amount_paid NUMERIC DEFAULT 0,
  offer_id TEXT,
  next_due_date TIMESTAMPTZ,
  payment_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'sales_offers' table for private student discounts
CREATE TABLE IF NOT EXISTS public.sales_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_email TEXT NOT NULL,
  student_email TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  offer_type TEXT NOT NULL, -- 'added_discount', 'free_month_trial', 'discounted_installment'
  discount_percent NUMERIC DEFAULT 0,
  custom_installment_amount NUMERIC DEFAULT 0,
  custom_total_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'redeemed', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create 'user_video_progress' table for tracking study hours & performance
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_email TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  lecture_id TEXT NOT NULL,
  watched_seconds NUMERIC DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_email, course_slug, lecture_id)
);

-- 6. Trigger to automatically sync auth.users to public.users upon user signup
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
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(
      new.raw_user_meta_data->>'role',
      CASE
        WHEN lower(new.email) = 'parhlo.pakistan.edu@gmail.com' THEN 'admin'
        WHEN lower(new.email) IN ('faiz.ali@parhlopakistan.com.pk', 'nabiha.irfan@parhlopakistan.com.pk') THEN 'sales'
        ELSE 'student'
      END
    ),
    new.raw_user_meta_data->>'intro',
    new.raw_user_meta_data->>'image'
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;

-- 7. Enable Row Level Security (RLS) on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- 8. Setup RLS Policies (Allow read/write for app usage, full access for admin)

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Public users full access" ON public.users;
CREATE POLICY "Public users full access" ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

-- COURSES TABLE POLICIES
DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Authenticated edit courses" ON public.courses;
CREATE POLICY "Authenticated edit courses" ON public.courses FOR ALL TO public USING (true) WITH CHECK (true);

-- PURCHASES TABLE POLICIES
DROP POLICY IF EXISTS "Public purchases access" ON public.purchases;
CREATE POLICY "Public purchases access" ON public.purchases FOR ALL TO public USING (true) WITH CHECK (true);

-- SALES OFFERS TABLE POLICIES
DROP POLICY IF EXISTS "Public sales_offers access" ON public.sales_offers;
CREATE POLICY "Public sales_offers access" ON public.sales_offers FOR ALL TO public USING (true) WITH CHECK (true);

-- VIDEO PROGRESS TABLE POLICIES
DROP POLICY IF EXISTS "Public user_video_progress access" ON public.user_video_progress;
CREATE POLICY "Public user_video_progress access" ON public.user_video_progress FOR ALL TO public USING (true) WITH CHECK (true);

-- 9. Insert Admin & Sales Representative User Records into public.users
INSERT INTO public.users (email, full_name, role) VALUES
  ('parhlo.pakistan.edu@gmail.com', 'Admin Parhlo', 'admin'),
  ('faiz.ali@parhlopakistan.com.pk', 'Faiz Ali', 'sales'),
  ('nabiha.irfan@parhlopakistan.com.pk', 'Nabiha Irfan', 'sales'),
  ('vaniya.ahmed.18@gmail.com', 'Dr. Vaniya Ahmed', 'teacher'),
  ('khadijaaqeelahmed20@gmail.com', 'Dr. Khadija Aqeel Ahmed', 'teacher'),
  ('muhammadzubair6879@gmail.com', 'M. Zubair Yousif', 'teacher'),
  ('farazsohail18@gmail.com', 'Dr. M Faraz Sohail', 'teacher')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
