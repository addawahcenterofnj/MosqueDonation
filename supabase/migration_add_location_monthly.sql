-- ============================================================
-- Migration: Add donor_location to donations + new monthly_reports table
-- Run this in the Supabase SQL Editor for existing deployments
-- ============================================================

-- 1. Add donor_location column to donations (safe to run even if already exists)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donor_location TEXT;

-- 2. Create monthly_reports table
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month      DATE NOT NULL UNIQUE,   -- stored as first day of month: YYYY-MM-01
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. updated_at trigger for monthly_reports
CREATE TRIGGER set_monthly_reports_updated_at
  BEFORE UPDATE ON public.monthly_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies
CREATE POLICY "monthly_reports_public_select"
  ON public.monthly_reports FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "monthly_reports_admin_insert"
  ON public.monthly_reports FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "monthly_reports_admin_update"
  ON public.monthly_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "monthly_reports_admin_delete"
  ON public.monthly_reports FOR DELETE
  TO authenticated
  USING (public.is_admin());
