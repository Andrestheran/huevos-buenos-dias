# 🔧 Database Migration Fix

## Issue Encountered

When running the initial database migration, you may see this error:

```
ERROR: 42P17: functions in index expression must be marked IMMUTABLE
```

## Root Cause

PostgreSQL requires functions used in index expressions to be marked as `IMMUTABLE`. The original migration used `DATE(created_at)` in a unique index, but the `DATE()` function is not always recognized as immutable.

```sql
-- ❌ This causes the error
CREATE UNIQUE INDEX idx_production_unique_daily
ON public.production_records (user_id, barn, DATE(created_at));
```

## Solution Applied

The migration has been updated to create an explicit `IMMUTABLE` function first:

```sql
-- ✅ Create immutable function
CREATE OR REPLACE FUNCTION public.created_at_date(created_at TIMESTAMPTZ)
RETURNS DATE AS $$
  SELECT created_at::DATE;
$$ LANGUAGE SQL IMMUTABLE;

-- ✅ Use it in the index
CREATE UNIQUE INDEX idx_production_unique_daily
ON public.production_records (user_id, barn, public.created_at_date(created_at));
```

## What This Does

- Creates a custom function that converts timestamp to date
- Marks it explicitly as `IMMUTABLE` (guarantees same input → same output)
- PostgreSQL can now safely use this function in the index
- Functionality remains exactly the same

## How to Apply

The fix is already in the migration file (`supabase/migrations/001_initial_schema.sql`).

### If you haven't run the migration yet:
Just follow the normal steps in [QUICK_START.md](QUICK_START.md) - it will work correctly now.

### If you already tried and got the error:
1. Go to Supabase Dashboard > SQL Editor
2. Delete the failed attempt (if needed):
   ```sql
   DROP INDEX IF EXISTS public.idx_production_unique_daily;
   ```
3. Re-run the complete migration from `001_initial_schema.sql`

## Verification

After running the migration successfully, verify the index exists:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'production_records';
```

You should see `idx_production_unique_daily` in the results.

## Testing

Test that duplicate prevention works:

```sql
-- Insert a record
INSERT INTO public.production_records (user_id, barn, a, aa, b, extra, jumbo)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'A', 100, 150, 80, 50, 20
);

-- Try to insert duplicate (same user, barn, and day) - should fail
INSERT INTO public.production_records (user_id, barn, a, aa, b, extra, jumbo)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'A', 200, 250, 180, 150, 120
);
```

Expected result:
```
ERROR: duplicate key value violates unique constraint "idx_production_unique_daily"
```

This proves the duplicate prevention is working! ✅

---

**Status**: ✅ Fixed in migration file
**Impact**: None - functionality is identical
**Performance**: Same (index still works optimally)

If you have any other database errors, check the [DEPLOYMENT.md - Troubleshooting](DEPLOYMENT.md#-troubleshooting) section.
