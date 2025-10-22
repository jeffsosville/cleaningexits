-- Test file to verify the migration works correctly
-- Run this AFTER running the main migration

-- Test 1: Verify helper functions exist in public schema
SELECT
  'public.user_vertical' as function_name,
  proname,
  pronargs as arg_count
FROM pg_proc
WHERE proname = 'user_vertical'
  AND pronamespace = 'public'::regnamespace;

SELECT
  'public.is_admin' as function_name,
  proname,
  pronargs as arg_count
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = 'public'::regnamespace;

SELECT
  'public.user_broker_id' as function_name,
  proname,
  pronargs as arg_count
FROM pg_proc
WHERE proname = 'user_broker_id'
  AND pronamespace = 'public'::regnamespace;

-- Test 2: Verify all tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('brokers', 'broker_verticals', 'listings', 'leads', 'deals', 'scraper_runs', 'scraper_logs')
ORDER BY tablename;

-- Test 3: Count RLS policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Test 4: Verify enums are created
SELECT
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('vertical_slug', 'lead_type', 'lead_status', 'listing_status', 'deal_status', 'scraper_status')
GROUP BY typname
ORDER BY typname;

-- Test 5: Verify indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('brokers', 'listings', 'leads', 'deals', 'scraper_runs')
ORDER BY tablename, indexname;

-- Test 6: Test helper functions (will return NULL without JWT, but should not error)
SELECT
  'Testing helper functions' as test_name,
  public.user_vertical() as vertical_result,
  public.is_admin() as admin_result,
  public.user_broker_id() as broker_result;

-- Test 7: Verify views exist
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('active_listings_with_broker', 'lead_pipeline', 'deal_metrics')
ORDER BY viewname;

-- Test 8: Verify triggers exist
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Success message
SELECT 'Migration verification completed successfully!' as status;
