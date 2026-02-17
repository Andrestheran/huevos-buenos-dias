-- ================================================
-- Buenos Días Huevos - Multi-Farm Migration
-- Version: 2.0.0
-- Date: Future (Q2 2026)
-- ================================================

-- THIS IS A FUTURE MIGRATION
-- Do NOT run this until ready to scale to multiple farms
-- Keep for reference and planning

-- ================================================
-- OVERVIEW
-- ================================================

-- This migration transforms the system from:
--   Single farm, 2 barns (enum) → Multiple farms, N barns (relational)
--
-- Changes:
--   1. Add farms table
--   2. Convert barn enum to barns table with FK to farms
--   3. Add farm_id to production_records
--   4. Update RLS policies for farm-scoped access
--   5. Migrate existing data
--   6. Update views and functions

-- ================================================
-- STEP 1: CREATE NEW TABLES
-- ================================================

-- Farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  manager_id UUID REFERENCES auth.users(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_farms_active ON public.farms(active);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Barns table
CREATE TABLE public.barns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(farm_id, name)
);

CREATE INDEX idx_barns_farm ON public.barns(farm_id);
CREATE INDEX idx_barns_active ON public.barns(active);
ALTER TABLE public.barns ENABLE ROW LEVEL SECURITY;

-- User-Farm associations (for multi-tenancy)
CREATE TABLE public.user_farm_access (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),

  PRIMARY KEY (user_id, farm_id)
);

CREATE INDEX idx_user_farm_access_user ON public.user_farm_access(user_id);
CREATE INDEX idx_user_farm_access_farm ON public.user_farm_access(farm_id);
ALTER TABLE public.user_farm_access ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 2: MIGRATE EXISTING DATA
-- ================================================

-- Create default farm
INSERT INTO public.farms (id, name, location, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Farm Principal', 'Location TBD', true);

-- Create barns A and B under default farm
INSERT INTO public.barns (farm_id, name, capacity, active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'A', 5000, true),
  ('00000000-0000-0000-0000-000000000001', 'B', 5000, true);

-- Grant all existing users access to default farm
INSERT INTO public.user_farm_access (user_id, farm_id)
SELECT id, '00000000-0000-0000-0000-000000000001'
FROM public.profiles;

-- ================================================
-- STEP 3: ADD NEW COLUMNS TO PRODUCTION_RECORDS
-- ================================================

-- Add farm_id and barn_id columns
ALTER TABLE public.production_records
  ADD COLUMN farm_id UUID REFERENCES public.farms(id),
  ADD COLUMN barn_id UUID REFERENCES public.barns(id);

-- Populate farm_id with default farm
UPDATE public.production_records
SET farm_id = '00000000-0000-0000-0000-000000000001';

-- Populate barn_id by mapping old barn enum to new barn table
UPDATE public.production_records pr
SET barn_id = b.id
FROM public.barns b
WHERE b.farm_id = pr.farm_id
  AND b.name = pr.barn::TEXT;

-- Make columns NOT NULL after migration
ALTER TABLE public.production_records
  ALTER COLUMN farm_id SET NOT NULL,
  ALTER COLUMN barn_id SET NOT NULL;

-- Create new indexes
CREATE INDEX idx_production_farm ON public.production_records(farm_id);
CREATE INDEX idx_production_barn_id ON public.production_records(barn_id);

-- ================================================
-- STEP 4: UPDATE UNIQUE CONSTRAINT
-- ================================================

-- Drop old unique constraint
DROP INDEX idx_production_unique_daily;

-- Create new constraint including farm_id and barn_id
CREATE UNIQUE INDEX idx_production_unique_daily_v2
ON public.production_records (user_id, barn_id, DATE(created_at));

-- ================================================
-- STEP 5: UPDATE RLS POLICIES
-- ================================================

-- Drop old policies
DROP POLICY IF EXISTS "Workers can insert own records" ON public.production_records;
DROP POLICY IF EXISTS "Workers can view own records" ON public.production_records;
DROP POLICY IF EXISTS "Admins can view all records" ON public.production_records;
DROP POLICY IF EXISTS "Admins can update records" ON public.production_records;
DROP POLICY IF EXISTS "Admins can delete records" ON public.production_records;

-- New policies with farm scoping
CREATE POLICY "Workers can insert records in their farms"
  ON public.production_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.user_farm_access
      WHERE user_id = auth.uid() AND farm_id = production_records.farm_id
    )
  );

CREATE POLICY "Workers can view own records"
  ON public.production_records
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Users can view records in their farms"
  ON public.production_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_farm_access
      WHERE user_id = auth.uid() AND farm_id = production_records.farm_id
    )
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update records"
  ON public.production_records
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete records"
  ON public.production_records
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Farms policies
CREATE POLICY "Users can view their accessible farms"
  ON public.farms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_farm_access
      WHERE user_id = auth.uid() AND farm_id = farms.id
    )
    OR public.is_admin(auth.uid())
  );

-- Barns policies
CREATE POLICY "Users can view barns in their farms"
  ON public.barns
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_farm_access
      WHERE user_id = auth.uid() AND farm_id = barns.farm_id
    )
    OR public.is_admin(auth.uid())
  );

-- User farm access policies
CREATE POLICY "Users can view their own farm access"
  ON public.user_farm_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage farm access"
  ON public.user_farm_access
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ================================================
-- STEP 6: UPDATE VIEWS
-- ================================================

-- Drop old views
DROP VIEW IF EXISTS public.daily_production_summary;
DROP VIEW IF EXISTS public.worker_performance;

-- Recreate with farm context
CREATE OR REPLACE VIEW public.daily_production_summary AS
SELECT
  f.name as farm_name,
  b.name as barn_name,
  DATE(pr.created_at) as production_date,
  COUNT(*) as record_count,
  SUM(pr.a) as total_a,
  SUM(pr.aa) as total_aa,
  SUM(pr.b) as total_b,
  SUM(pr.extra) as total_extra,
  SUM(pr.jumbo) as total_jumbo,
  SUM(pr.total) as total_eggs
FROM public.production_records pr
JOIN public.barns b ON pr.barn_id = b.id
JOIN public.farms f ON pr.farm_id = f.id
GROUP BY f.name, b.name, DATE(pr.created_at)
ORDER BY production_date DESC, f.name, b.name;

CREATE OR REPLACE VIEW public.worker_performance AS
SELECT
  f.name as farm_name,
  pr.user_id,
  p.full_name,
  COUNT(*) as total_submissions,
  SUM(pr.total) as total_eggs_recorded,
  AVG(pr.total) as avg_eggs_per_submission,
  MAX(pr.created_at) as last_submission
FROM public.production_records pr
JOIN public.profiles p ON pr.user_id = p.id
JOIN public.farms f ON pr.farm_id = f.id
GROUP BY f.name, pr.user_id, p.full_name
ORDER BY f.name, total_eggs_recorded DESC;

-- ================================================
-- STEP 7: UPDATE FUNCTIONS
-- ================================================

-- Updated stats function with farm parameter
CREATE OR REPLACE FUNCTION public.get_production_stats(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  filter_farm UUID DEFAULT NULL,
  filter_barn UUID DEFAULT NULL,
  filter_user UUID DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  farm_name TEXT,
  barn_name TEXT,
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
    f.name as farm_name,
    b.name as barn_name,
    SUM(pr.total)::BIGINT as total_eggs,
    SUM(pr.a)::BIGINT as total_a,
    SUM(pr.aa)::BIGINT as total_aa,
    SUM(pr.b)::BIGINT as total_b,
    SUM(pr.extra)::BIGINT as total_extra,
    SUM(pr.jumbo)::BIGINT as total_jumbo,
    COUNT(*)::BIGINT as record_count
  FROM public.production_records pr
  JOIN public.barns b ON pr.barn_id = b.id
  JOIN public.farms f ON pr.farm_id = f.id
  WHERE pr.created_at >= start_date
    AND pr.created_at <= end_date
    AND (filter_farm IS NULL OR pr.farm_id = filter_farm)
    AND (filter_barn IS NULL OR pr.barn_id = filter_barn)
    AND (filter_user IS NULL OR pr.user_id = filter_user)
  GROUP BY DATE(pr.created_at), f.name, b.name
  ORDER BY date DESC, f.name, b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated can_submit function
CREATE OR REPLACE FUNCTION public.can_submit_today(
  check_user_id UUID,
  check_barn_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.production_records
    WHERE user_id = check_user_id
      AND barn_id = check_barn_id
      AND DATE(created_at) = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 8: OPTIONAL - DROP OLD BARN ENUM
-- ================================================

-- Only drop after confirming all queries updated
-- ALTER TABLE public.production_records DROP COLUMN barn;
-- DROP TYPE barn_type;

-- ================================================
-- STEP 9: UPDATE TRIGGERS
-- ================================================

CREATE TRIGGER set_updated_at_farms
  BEFORE UPDATE ON public.farms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_barns
  BEFORE UPDATE ON public.barns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- MIGRATION CHECKLIST
-- ================================================

-- Before running:
--   [ ] Backup database
--   [ ] Test on staging environment
--   [ ] Update frontend to use new farm/barn selectors
--   [ ] Update API queries to include farm_id
--   [ ] Verify RLS policies with test users
--
-- After running:
--   [ ] Verify data integrity (no orphaned records)
--   [ ] Check performance of new indexes
--   [ ] Test worker flow (can select farm then barn)
--   [ ] Test admin dashboard (filters work correctly)
--   [ ] Monitor for query performance issues
--   [ ] Update documentation

-- ================================================
-- ROLLBACK SCRIPT (if needed)
-- ================================================

-- Keep old columns for 30 days after migration
-- If rollback needed:
--
-- 1. Re-enable barn enum column usage in app
-- 2. Drop new tables:
--    DROP TABLE public.user_farm_access CASCADE;
--    DROP TABLE public.barns CASCADE;
--    DROP TABLE public.farms CASCADE;
-- 3. Remove farm_id, barn_id from production_records
-- 4. Restore old RLS policies
-- 5. Restore old views/functions

-- ================================================
-- END OF MIGRATION
-- ================================================
