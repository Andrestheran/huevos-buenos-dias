-- ================================================
-- Migration: Add frozen egg type and mortality tracking
-- Version: 1.1.0
-- Date: 2026-02-18
-- Description: Adds frozen egg type (included in total) and mortality field (informative only)
-- ================================================

BEGIN;

-- Step 1: Drop views that depend on the total column
DROP VIEW IF EXISTS public.daily_production_summary CASCADE;
DROP VIEW IF EXISTS public.worker_performance CASCADE;

-- Step 2: Add new columns with default values for backward compatibility
ALTER TABLE public.production_records
ADD COLUMN frozen INTEGER NOT NULL DEFAULT 0 CHECK (frozen >= 0);

ALTER TABLE public.production_records
ADD COLUMN mortality INTEGER NOT NULL DEFAULT 0 CHECK (mortality >= 0);

-- Step 3: Drop the old generated total column (now safe, no dependencies)
ALTER TABLE public.production_records
DROP COLUMN total;

-- Step 4: Recreate total column including frozen eggs
ALTER TABLE public.production_records
ADD COLUMN total INTEGER GENERATED ALWAYS AS (a + aa + b + extra + jumbo + frozen) STORED;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.production_records.frozen IS 'Frozen eggs count (included in total production)';
COMMENT ON COLUMN public.production_records.mortality IS 'Number of chickens that died this day (informative only, not included in egg total)';
COMMENT ON COLUMN public.production_records.total IS 'Auto-calculated sum: a + aa + b + extra + jumbo + frozen';

-- Step 6: Recreate daily_production_summary view with new fields
CREATE VIEW public.daily_production_summary AS
SELECT
  DATE(created_at) as production_date,
  barn,
  COUNT(*) as record_count,
  SUM(a) as total_a,
  SUM(aa) as total_aa,
  SUM(b) as total_b,
  SUM(extra) as total_extra,
  SUM(jumbo) as total_jumbo,
  SUM(frozen) as total_frozen,
  SUM(mortality) as total_mortality,
  SUM(total) as total_eggs
FROM public.production_records
GROUP BY DATE(created_at), barn
ORDER BY production_date DESC, barn;

COMMENT ON VIEW public.daily_production_summary IS 'Daily aggregated production statistics by barn including frozen eggs and mortality';

-- Step 7: Recreate worker_performance view
CREATE VIEW public.worker_performance AS
SELECT
  pr.user_id,
  p.full_name,
  COUNT(*) as total_submissions,
  SUM(pr.total) as total_eggs_recorded,
  AVG(pr.total) as avg_eggs_per_submission,
  MAX(pr.created_at) as last_submission
FROM public.production_records pr
LEFT JOIN public.profiles p ON pr.user_id = p.id
GROUP BY pr.user_id, p.full_name;

COMMENT ON VIEW public.worker_performance IS 'Worker performance statistics including submission counts and averages';

-- Step 8: Grant view access
GRANT SELECT ON public.daily_production_summary TO authenticated;
GRANT SELECT ON public.worker_performance TO authenticated;

-- Step 9: Update get_production_stats function to include frozen and mortality
DROP FUNCTION IF EXISTS public.get_production_stats(TIMESTAMPTZ, TIMESTAMPTZ, barn_type, UUID);

CREATE FUNCTION public.get_production_stats(
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
  total_frozen BIGINT,
  total_mortality BIGINT,
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
    SUM(pr.frozen)::BIGINT as total_frozen,
    SUM(pr.mortality)::BIGINT as total_mortality,
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

COMMENT ON FUNCTION public.get_production_stats IS 'Get aggregated production statistics with date range and optional filters for barn and user';

COMMIT;

-- ================================================
-- Verification queries (run after migration)
-- ================================================

-- Verify new columns exist
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'production_records'
-- AND column_name IN ('frozen', 'mortality', 'total');

-- Verify total calculation includes frozen
-- INSERT INTO production_records (user_id, barn, a, frozen, mortality)
-- VALUES ('your-user-id', 'A', 100, 50, 3);
-- SELECT a, frozen, mortality, total FROM production_records ORDER BY created_at DESC LIMIT 1;
-- Expected: total = 150 (a + frozen), mortality does not affect total

-- Verify view includes new fields
-- SELECT * FROM daily_production_summary ORDER BY production_date DESC LIMIT 1;
