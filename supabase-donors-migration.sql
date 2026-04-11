-- Run this in your Supabase SQL editor (https://app.supabase.com → SQL Editor)

-- Allow donations without a campaign (month-based donations)
ALTER TABLE donations ALTER COLUMN campaign_id DROP NOT NULL;


CREATE TABLE IF NOT EXISTS donors (
  phone       TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- Anyone can read donor records (public transparency)
CREATE POLICY "Public can read donors"
  ON donors FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert donors"
  ON donors FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update
CREATE POLICY "Authenticated users can update donors"
  ON donors FOR UPDATE
  USING (auth.role() = 'authenticated');
