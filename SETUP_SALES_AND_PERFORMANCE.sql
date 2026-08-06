-- SQL Setup script for Sales Offers, Video Progress Tracking, and Payment Enhancements

-- 1. Create 'sales_offers' table for custom private student offers
CREATE TABLE IF NOT EXISTS public.sales_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- 2. Create 'user_video_progress' table for study time & performance tracking
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_email TEXT NOT NULL,
  course_slug TEXT NOT NULL,
  lecture_id TEXT NOT NULL,
  watched_seconds NUMERIC DEFAULT 0,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_email, course_slug, lecture_id)
);

-- 3. Extend 'purchases' table with custom price, amount paid, and custom offer fields
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS total_price NUMERIC;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS monthly_installment_amount NUMERIC;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS offer_id TEXT;

-- 4. Enable Row Level Security & Allow authenticated access
ALTER TABLE public.sales_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read/write sales_offers" ON public.sales_offers;
CREATE POLICY "Allow authenticated read/write sales_offers" ON public.sales_offers
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read/write sales_offers" ON public.sales_offers;
CREATE POLICY "Allow anon read/write sales_offers" ON public.sales_offers
FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read/write user_video_progress" ON public.user_video_progress;
CREATE POLICY "Allow authenticated read/write user_video_progress" ON public.user_video_progress
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read/write user_video_progress" ON public.user_video_progress;
CREATE POLICY "Allow anon read/write user_video_progress" ON public.user_video_progress
FOR ALL TO public USING (true) WITH CHECK (true);
