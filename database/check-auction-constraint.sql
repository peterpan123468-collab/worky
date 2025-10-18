-- Check the current constraint on the auctions table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM 
    pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE 
    t.relname = 'auctions' 
    AND n.nspname = 'public'
    AND conname LIKE '%status%';

-- Check the current data in the auctions table that might be causing issues
SELECT 
    id, 
    status, 
    created_at, 
    updated_at
FROM 
    auctions 
WHERE 
    status NOT IN ('active', 'ended', 'cancelled')
LIMIT 10;

-- Check if there are any auctions with 'ended' status already
SELECT 
    COUNT(*) as ended_auctions_count
FROM 
    auctions 
WHERE 
    status = 'ended';