-- ============================================================
-- Mosque Donation Tracker - Supabase Schema
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Links to auth.users, stores role
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: donations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name     TEXT NOT NULL,
  donor_phone    TEXT,
  donor_location TEXT,
  campaign_id    UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  amount         NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  donation_date  DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: monthly_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month      DATE NOT NULL UNIQUE,   -- stored as first day of month: YYYY-MM-01
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTION: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_monthly_reports_updated_at
  BEFORE UPDATE ON public.monthly_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- Returns true if current user has role = 'admin' in profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: owner can read their own; admin can read all
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Campaigns: public read
CREATE POLICY "campaigns_public_select"
  ON public.campaigns FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Campaigns: admin write
CREATE POLICY "campaigns_admin_insert"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "campaigns_admin_update"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "campaigns_admin_delete"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Donations: public read
CREATE POLICY "donations_public_select"
  ON public.donations FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Monthly reports: public read
CREATE POLICY "monthly_reports_public_select"
  ON public.monthly_reports FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Monthly reports: admin write
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

-- Donations: admin write
CREATE POLICY "donations_admin_insert"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "donations_admin_update"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "donations_admin_delete"
  ON public.donations FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- OPTIONAL SEED DATA (remove in production)
-- ============================================================

-- INSERT INTO public.campaigns (name, description, start_date, end_date, is_active) VALUES
--   ('Masjid Renovation 2024', 'Fund for main hall renovation', '2024-01-01', '2024-12-31', TRUE),
--   ('Ramadan Aid 2024', 'Helping families during Ramadan', '2024-03-01', '2024-04-30', FALSE);

-- ============================================================
-- ADMIN SETUP INSTRUCTIONS
-- ============================================================
-- After running this script:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite user" or "Add user" to create an admin account
-- 3. Then run the following (replace with actual user UUID and email):
--
--   INSERT INTO public.profiles (id, email, role)
--   VALUES ('your-user-uuid', 'admin@example.com', 'admin')
--   ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
-- 4. Go to Authentication > Settings > Disable "Enable email signup"
-- ============================================================
