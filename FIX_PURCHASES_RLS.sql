-- SQL Fix for purchases and sales_offers Row Level Security (RLS) policies
-- Allows public (anon + authenticated) SELECT, INSERT, and UPDATE access so student sessions can always query and auto-sync their enrolled courses.

-- 1. Ensure RLS on purchases allows public access
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public purchases access" ON public.purchases;
DROP POLICY IF EXISTS "Students can view own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Students can insert own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow admin all access to purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow service role all access to purchases" ON public.purchases;

CREATE POLICY "Public purchases access" ON public.purchases
FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Ensure RLS on sales_offers allows public access
ALTER TABLE public.sales_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read/write sales_offers" ON public.sales_offers;
DROP POLICY IF EXISTS "Allow anon read/write sales_offers" ON public.sales_offers;
DROP POLICY IF EXISTS "Public sales_offers access" ON public.sales_offers;

CREATE POLICY "Public sales_offers access" ON public.sales_offers
FOR ALL TO public USING (true) WITH CHECK (true);
