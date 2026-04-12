-- ============================================================
-- Mosque Donation Tracker — Supabase Schema (consolidated)
-- Safe to run on an existing database — uses IF NOT EXISTS /
-- DROP IF EXISTS / CREATE OR REPLACE throughout.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.donations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name     TEXT NOT NULL,
  donor_phone    TEXT,
  donor_location TEXT,
  campaign_id    UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  amount         NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  donation_date  DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make campaign_id nullable if it was previously NOT NULL
ALTER TABLE public.donations ALTER COLUMN campaign_id DROP NOT NULL;

-- Persistent donor directory — records are never deleted
CREATE TABLE IF NOT EXISTS public.donors (
  phone      TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  location   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receipt image tracking per year/month
CREATE TABLE IF NOT EXISTS public.monthly_receipts (
  year         INT NOT NULL,
  month        INT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (year, month)
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS (drop first so re-runs don't error)
-- ============================================================

DROP TRIGGER IF EXISTS set_campaigns_updated_at    ON public.campaigns;
DROP TRIGGER IF EXISTS set_donations_updated_at    ON public.donations;
DROP TRIGGER IF EXISTS set_donors_updated_at       ON public.donors;
DROP TRIGGER IF EXISTS on_auth_user_created        ON auth.users;

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DROP POLICY IF EXISTS "profiles_select"                 ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"             ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"             ON public.profiles;

DROP POLICY IF EXISTS "campaigns_public_select"         ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_insert"          ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_update"          ON public.campaigns;
DROP POLICY IF EXISTS "campaigns_admin_delete"          ON public.campaigns;

DROP POLICY IF EXISTS "donations_public_select"         ON public.donations;
DROP POLICY IF EXISTS "donations_admin_insert"          ON public.donations;
DROP POLICY IF EXISTS "donations_admin_update"          ON public.donations;
DROP POLICY IF EXISTS "donations_admin_delete"          ON public.donations;

DROP POLICY IF EXISTS "donors_public_select"            ON public.donors;
DROP POLICY IF EXISTS "Public can read donors"          ON public.donors;
DROP POLICY IF EXISTS "donors_admin_insert"             ON public.donors;
DROP POLICY IF EXISTS "Authenticated users can insert donors" ON public.donors;
DROP POLICY IF EXISTS "donors_admin_update"             ON public.donors;
DROP POLICY IF EXISTS "Authenticated users can update donors" ON public.donors;

DROP POLICY IF EXISTS "monthly_receipts_public_select"  ON public.monthly_receipts;
DROP POLICY IF EXISTS "Public read monthly_receipts"    ON public.monthly_receipts;
DROP POLICY IF EXISTS "monthly_receipts_admin_all"      ON public.monthly_receipts;
DROP POLICY IF EXISTS "Admin manage monthly_receipts"   ON public.monthly_receipts;

-- ── profiles ────────────────────────────────────────────────
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ── campaigns ───────────────────────────────────────────────
CREATE POLICY "campaigns_public_select"
  ON public.campaigns FOR SELECT
  TO anon, authenticated
  USING (TRUE);

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

-- ── donations ───────────────────────────────────────────────
CREATE POLICY "donations_public_select"
  ON public.donations FOR SELECT
  TO anon, authenticated
  USING (TRUE);

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

-- ── donors ──────────────────────────────────────────────────
-- No DELETE policy — donor records are permanent by design.
CREATE POLICY "donors_public_select"
  ON public.donors FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "donors_admin_insert"
  ON public.donors FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "donors_admin_update"
  ON public.donors FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ── monthly_receipts ────────────────────────────────────────
CREATE POLICY "monthly_receipts_public_select"
  ON public.monthly_receipts FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "monthly_receipts_admin_all"
  ON public.monthly_receipts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- ADMIN SETUP (run after this script)
-- ============================================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create the admin user account
-- 3. Promote to admin (replace the values below):
--
--   INSERT INTO public.profiles (id, email, role)
--   VALUES ('your-user-uuid', 'admin@example.com', 'admin')
--   ON CONFLICT (id) DO UPDATE SET role = 'admin';
--
-- ============================================================
-- STORAGE BUCKET SETUP (Dashboard UI)
-- ============================================================
-- Storage → New bucket
--   Name:   receipts
--   Public: ✅
-- Storage policy for uploads:
--   Allowed operation: INSERT
--   Definition: (auth.uid() IS NOT NULL)
-- ============================================================
