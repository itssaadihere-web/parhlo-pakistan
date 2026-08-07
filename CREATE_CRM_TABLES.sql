-- ==============================================================================
-- PARHLO PAKISTAN - CRM MODULE DATABASE SETUP SCRIPT
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Create 'leads' table for tracking imported student prospects
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  assigned_to TEXT DEFAULT '', -- Email of assigned sales representative
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'interested', 'demo_scheduled', 'converted', 'lost'
  source TEXT DEFAULT 'excel_import',
  course_interest TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  next_followup_at TIMESTAMPTZ,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create 'lead_activities' table for detailed call, message, & status log history
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sales_email TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'call', 'whatsapp', 'email', 'note', 'status_change', 'followup_scheduled'
  call_status TEXT, -- 'connected', 'busy', 'no_answer', 'scheduled'
  notes TEXT DEFAULT '',
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Public leads full access" ON public.leads;
CREATE POLICY "Public leads full access" ON public.leads FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public lead_activities full access" ON public.lead_activities;
CREATE POLICY "Public lead_activities full access" ON public.lead_activities FOR ALL TO public USING (true) WITH CHECK (true);
