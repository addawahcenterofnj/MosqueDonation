-- Migration: Change monthly_reports.month from DATE to TEXT
-- Run this in the Supabase SQL Editor

ALTER TABLE public.monthly_reports DROP CONSTRAINT IF EXISTS monthly_reports_month_key;
ALTER TABLE public.monthly_reports ALTER COLUMN month TYPE TEXT USING month::TEXT;
ALTER TABLE public.monthly_reports ADD CONSTRAINT monthly_reports_month_key UNIQUE (month);
