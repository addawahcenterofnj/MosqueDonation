-- ─────────────────────────────────────────────────────────────
-- Monthly Receipt Images  (run once in Supabase SQL Editor)
-- ─────────────────────────────────────────────────────────────

-- 1. Table to track which month/year has a receipt stored
CREATE TABLE IF NOT EXISTS monthly_receipts (
  year  INT NOT NULL,
  month INT NOT NULL,         -- 1-based  (1 = January … 12 = December)
  storage_path TEXT NOT NULL, -- path inside the 'receipts' bucket
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (year, month)
);

ALTER TABLE monthly_receipts ENABLE ROW LEVEL SECURITY;

-- Anyone (including visitors) can read receipt metadata
CREATE POLICY "Public read monthly_receipts"
  ON monthly_receipts FOR SELECT USING (true);

-- Only admins can insert / update / delete
CREATE POLICY "Admin manage monthly_receipts"
  ON monthly_receipts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. Supabase Storage bucket — do this in the Dashboard UI:
--
--    Storage → New bucket
--      Name : receipts
--      Public: ✅ (so image URLs work without a token)
--
--    Then add a Storage Policy (for uploads):
--      Allowed operation : INSERT
--      Policy definition : (auth.uid() IS NOT NULL)   ← any logged-in user
--    (Admins are already the only users who can log in to the app.)
-- ─────────────────────────────────────────────────────────────
