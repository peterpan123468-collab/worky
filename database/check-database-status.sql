-- =============================================
-- WORKY DATABASE STATUS CHECK
-- =============================================
-- Run this in Supabase SQL Editor to check database setup

-- Check if all required tables exist
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All tables exist'
    ELSE '❌ Missing tables: ' || (8 - COUNT(*))::TEXT
  END as status,
  string_agg(table_name, ', ') as tables_found
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 
  'handyman_profiles', 
  'time_slots', 
  'bookings', 
  'auctions', 
  'auction_bids', 
  'notifications', 
  'calendar_integrations'
);

-- Check RLS status on all tables
WITH rls_check AS (
  SELECT 
    schemaname,
    tablename,
    rowsecurity
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename IN (
    'users', 
    'handyman_profiles', 
    'time_slots', 
    'bookings', 
    'auctions', 
    'auction_bids', 
    'notifications', 
    'calendar_integrations'
  )
)
SELECT 
  'RLS Check' as check_type,
  CASE 
    WHEN COUNT(*) FILTER (WHERE rowsecurity = true) = COUNT(*) THEN '✅ RLS enabled on all tables'
    ELSE '❌ RLS not enabled on some tables'
  END as status,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rowsecurity = true) as rls_enabled_count
FROM rls_check;

-- Check if required functions exist
SELECT 
  'Functions Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ All required functions exist'
    ELSE '❌ Missing functions'
  END as status,
  string_agg(routine_name, ', ') as functions_found
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'handle_new_user', 
  'place_auction_bid', 
  'close_expired_auctions'
);

-- Check if required indexes exist  
WITH index_check AS (
  SELECT 
    schemaname,
    tablename,
    indexname
  FROM pg_indexes 
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
)
SELECT 
  'Indexes Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ Performance indexes created'
    ELSE '⚠️ Some indexes may be missing'
  END as status,
  COUNT(*) as indexes_found
FROM index_check;

-- Check specific table structures
SELECT 
  'Auction System Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auctions' AND column_name = 'current_highest_bid')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auction_bids' AND column_name = 'is_winning_bid')
    THEN '✅ Auction system tables properly configured'
    ELSE '❌ Auction system tables need setup'
  END as status;

SELECT 
  'Calendar Integration Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_integrations' AND column_name = 'calendar_provider')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_slots' AND column_name = 'calendar_event_id')
    THEN '✅ Calendar integration tables properly configured'
    ELSE '❌ Calendar integration tables need setup'
  END as status;

SELECT 
  'Notification System Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type')
    THEN '✅ Notification system properly configured'
    ELSE '❌ Notification system needs setup'
  END as status;

-- Check for foreign key constraints
SELECT 
  'Foreign Keys Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ Foreign key constraints in place'
    ELSE '⚠️ Some foreign keys may be missing'
  END as status,
  COUNT(*) as constraints_found
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
AND constraint_type = 'FOREIGN KEY'
AND table_name IN (
  'handyman_profiles', 
  'time_slots', 
  'bookings', 
  'auctions', 
  'auction_bids', 
  'notifications', 
  'calendar_integrations'
);

-- Sample data check
SELECT 
  'Sample Data Check' as check_type,
  CONCAT(
    'Users: ', (SELECT COUNT(*) FROM users), ', ',
    'Handymen: ', (SELECT COUNT(*) FROM handyman_profiles), ', ',
    'Auctions: ', (SELECT COUNT(*) FROM auctions), ', ',
    'Bookings: ', (SELECT COUNT(*) FROM bookings)
  ) as current_data;

-- Check for any policy conflicts or issues
SELECT 
  'Policies Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ RLS policies configured'
    ELSE '⚠️ Some RLS policies may be missing'
  END as status,
  COUNT(*) as policies_found
FROM pg_policies
WHERE schemaname = 'public';

-- Overall status summary
SELECT 
  '=== OVERALL STATUS ===' as summary,
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'handyman_profiles', 'time_slots', 'bookings', 'auctions', 'auction_bids', 'notifications', 'calendar_integrations')) = 8
      AND (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('handle_new_user', 'place_auction_bid', 'close_expired_auctions')) >= 3
    ) THEN '✅ DATABASE READY FOR USER JOURNEYS'
    ELSE '❌ DATABASE NEEDS SETUP - Run schema.sql'
  END as status;