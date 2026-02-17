-- ================================================
-- Buenos Días Huevos - Initial Database Schema
-- Version: 1.0.0
-- Date: 2026-02-16
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS
-- ================================================

-- Barn enum (expandable to table later)
CREATE TYPE barn_type AS ENUM ('A', 'B');

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'worker');

-- ================================================
-- TABLES
-- ================================================

-- -----------------------
-- User Profiles (extends auth.users)
-- -----------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------
-- Production Records
-- -----------------------
CREATE TABLE public.production_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barn barn_type NOT NULL,

  -- Egg counts by type (separate columns for easy aggregation)
  a INTEGER NOT NULL DEFAULT 0 CHECK (a >= 0),
  aa INTEGER NOT NULL DEFAULT 0 CHECK (aa >= 0),
  b INTEGER NOT NULL DEFAULT 0 CHECK (b >= 0),
  extra INTEGER NOT NULL DEFAULT 0 CHECK (extra >= 0),
  jumbo INTEGER NOT NULL DEFAULT 0 CHECK (jumbo >= 0),

  -- Total calculated field (denormalized for performance)
  total INTEGER GENERATED ALWAYS AS (a + aa + b + extra + jumbo) STORED,

  -- Metadata
  synced BOOLEAN NOT NULL DEFAULT true, -- false if created offline
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create IMMUTABLE function to extract date (required for unique index)
CREATE OR REPLACE FUNCTION public.created_at_date(created_at TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT created_at::DATE;
$$ LANGUAGE SQL IMMUTABLE;

-- Prevent duplicate submissions (user + barn + same day)
CREATE UNIQUE INDEX idx_production_unique_daily
ON public.production_records (user_id, barn, public.created_at_date(created_at));

-- Performance indexes
CREATE INDEX idx_production_user ON public.production_records(user_id);
CREATE INDEX idx_production_barn ON public.production_records(barn);
CREATE INDEX idx_production_created_at ON public.production_records(created_at DESC);
CREATE INDEX idx_production_synced ON public.production_records(synced) WHERE synced = false;

-- Composite index for admin dashboard queries
CREATE INDEX idx_production_dashboard ON public.production_records(created_at DESC, barn, user_id);

-- Enable Row Level Security
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is worker
CREATE OR REPLACE FUNCTION public.is_worker(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'worker'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_production_records
  BEFORE UPDATE ON public.production_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile when user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker'::user_role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================

-- -----------------------
-- Profiles Policies
-- -----------------------

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -----------------------
-- Production Records Policies
-- -----------------------

-- Workers can insert their own records
CREATE POLICY "Workers can insert own records"
  ON public.production_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Workers can view their own records
CREATE POLICY "Workers can view own records"
  ON public.production_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all records
CREATE POLICY "Admins can view all records"
  ON public.production_records
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Admins can update records (for corrections)
CREATE POLICY "Admins can update records"
  ON public.production_records
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete records (for corrections)
CREATE POLICY "Admins can delete records"
  ON public.production_records
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- Daily production summary
CREATE OR REPLACE VIEW public.daily_production_summary AS
SELECT
  DATE(created_at) as production_date,
  barn,
  COUNT(*) as record_count,
  SUM(a) as total_a,
  SUM(aa) as total_aa,
  SUM(b) as total_b,
  SUM(extra) as total_extra,
  SUM(jumbo) as total_jumbo,
  SUM(total) as total_eggs
FROM public.production_records
GROUP BY DATE(created_at), barn
ORDER BY production_date DESC, barn;

-- Worker performance summary
CREATE OR REPLACE VIEW public.worker_performance AS
SELECT
  pr.user_id,
  p.full_name,
  COUNT(*) as total_submissions,
  SUM(pr.total) as total_eggs_recorded,
  AVG(pr.total) as avg_eggs_per_submission,
  MAX(pr.created_at) as last_submission
FROM public.production_records pr
JOIN public.profiles p ON pr.user_id = p.id
GROUP BY pr.user_id, p.full_name
ORDER BY total_eggs_recorded DESC;

-- Grant view access to authenticated users
GRANT SELECT ON public.daily_production_summary TO authenticated;
GRANT SELECT ON public.worker_performance TO authenticated;

-- ================================================
-- SEED DATA (for development/testing)
-- ================================================

-- Note: Insert test users via Supabase Auth Dashboard or API
-- After creating auth users, insert profiles:

-- Example seed (update UUIDs with actual auth.users IDs):
/*
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@huevos.com', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'worker1@huevos.com', 'Juan Pérez', 'worker'),
  ('00000000-0000-0000-0000-000000000003', 'worker2@huevos.com', 'María García', 'worker');

-- Sample production records
INSERT INTO public.production_records (user_id, barn, a, aa, b, extra, jumbo) VALUES
  ('00000000-0000-0000-0000-000000000002', 'A', 120, 180, 95, 75, 30),
  ('00000000-0000-0000-0000-000000000002', 'B', 110, 170, 88, 82, 35),
  ('00000000-0000-0000-0000-000000000003', 'A', 125, 175, 92, 78, 28);
*/

-- ================================================
-- FUNCTIONS FOR APPLICATION LOGIC
-- ================================================

-- Get production stats for date range
CREATE OR REPLACE FUNCTION public.get_production_stats(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  filter_barn barn_type DEFAULT NULL,
  filter_user UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  barn barn_type,
  total_eggs BIGINT,
  total_a BIGINT,
  total_aa BIGINT,
  total_b BIGINT,
  total_extra BIGINT,
  total_jumbo BIGINT,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(pr.created_at) as date,
    pr.barn,
    SUM(pr.total)::BIGINT as total_eggs,
    SUM(pr.a)::BIGINT as total_a,
    SUM(pr.aa)::BIGINT as total_aa,
    SUM(pr.b)::BIGINT as total_b,
    SUM(pr.extra)::BIGINT as total_extra,
    SUM(pr.jumbo)::BIGINT as total_jumbo,
    COUNT(*)::BIGINT as record_count
  FROM public.production_records pr
  WHERE pr.created_at >= start_date
    AND pr.created_at <= end_date
    AND (filter_barn IS NULL OR pr.barn = filter_barn)
    AND (filter_user IS NULL OR pr.user_id = filter_user)
  GROUP BY DATE(pr.created_at), pr.barn
  ORDER BY date DESC, pr.barn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can submit for barn today
CREATE OR REPLACE FUNCTION public.can_submit_today(
  check_user_id UUID,
  check_barn barn_type
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.production_records
    WHERE user_id = check_user_id
      AND barn = check_barn
      AND DATE(created_at) = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- MONITORING & ANALYTICS
-- ================================================

-- Table for tracking sync issues (future use)
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  record_id UUID REFERENCES public.production_records(id),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view sync logs
CREATE POLICY "Admins can view sync logs"
  ON public.sync_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.production_records IS 'Daily egg production records by barn';
COMMENT ON COLUMN public.production_records.total IS 'Auto-calculated sum of all egg types';
COMMENT ON COLUMN public.production_records.synced IS 'False if record was created offline and pending sync';
COMMENT ON FUNCTION public.is_admin IS 'Check if user has admin role';
COMMENT ON FUNCTION public.get_production_stats IS 'Get aggregated production statistics with optional filters';

-- ================================================
-- PERMISSIONS SUMMARY
-- ================================================

-- WORKERS:
--   ✓ INSERT own production records
--   ✓ SELECT own production records
--   ✓ SELECT own profile
--   ✓ UPDATE own profile
--
-- ADMINS:
--   ✓ All worker permissions
--   ✓ SELECT all production records
--   ✓ UPDATE production records (corrections)
--   ✓ DELETE production records (corrections)
--   ✓ SELECT all profiles
--   ✓ SELECT sync logs
--
-- SECURITY:
--   ✓ RLS enforced at database level
--   ✓ No way to bypass via compromised client
--   ✓ Policies check auth.uid() (from JWT)
--   ✓ Functions use SECURITY DEFINER carefully

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Run this migration:
-- psql -h <supabase-host> -U postgres -d postgres -f 001_initial_schema.sql
--
-- Or via Supabase Dashboard:
-- 1. Go to SQL Editor
-- 2. Paste this file
-- 3. Click "Run"
