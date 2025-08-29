-- Query to check all tables in your Worky database
-- Copy and paste this SQL into your Supabase SQL Editor

-- 1. Check if all expected tables exist
SELECT 
    table_name,
    'Exists' as status
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
        'payment_intents',
        'payouts'
    )
ORDER BY table_name;

-- 2. Get detailed table information with row counts
SELECT 
    t.table_name,
    t.table_type,
    pg_size_pretty(pg_total_relation_size(c.oid)) as table_size,
    (
        SELECT count(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
    ) as column_count,
    CASE 
        WHEN t.table_name = 'users' THEN (SELECT count(*) FROM public.users)
        WHEN t.table_name = 'handyman_profiles' THEN (SELECT count(*) FROM public.handyman_profiles)
        WHEN t.table_name = 'time_slots' THEN (SELECT count(*) FROM public.time_slots)
        WHEN t.table_name = 'bookings' THEN (SELECT count(*) FROM public.bookings)
        WHEN t.table_name = 'auctions' THEN (SELECT count(*) FROM public.auctions)
        WHEN t.table_name = 'auction_bids' THEN (SELECT count(*) FROM public.auction_bids)
        WHEN t.table_name = 'notifications' THEN (SELECT count(*) FROM public.notifications)
        WHEN t.table_name = 'payment_intents' THEN (SELECT count(*) FROM public.payment_intents)
        WHEN t.table_name = 'payouts' THEN (SELECT count(*) FROM public.payouts)
        ELSE 0
    END as row_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
    AND t.table_name IN (
        'users',
        'handyman_profiles', 
        'time_slots',
        'bookings',
        'auctions',
        'auction_bids',
        'notifications',
        'payment_intents',
        'payouts'
    )
ORDER BY t.table_name;

-- 3. Check Row Level Security (RLS) status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled ✅'
        ELSE 'RLS Disabled ❌'
    END as security_status
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
        'payment_intents',
        'payouts'
    )
ORDER BY tablename;

-- 4. Check if triggers exist
SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation as trigger_event,
    'Exists ✅' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name IN (
        'on_auth_user_created',
        'on_booking_created'
    )
ORDER BY trigger_name;

-- 5. Check if functions exist
SELECT 
    routine_name as function_name,
    routine_type,
    'Exists ✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'handle_new_user',
        'handle_booking_conflict', 
        'complete_auction'
    )
ORDER BY routine_name;

-- 6. Check indexes
SELECT 
    indexname,
    tablename,
    'Exists ✅' as status
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;