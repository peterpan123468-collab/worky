-- Fix for auction status constraint issue
-- This script will check and fix any constraint issues with the auctions table

-- First, let's check what the current constraint actually is
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

-- Check for any invalid status values
SELECT DISTINCT status FROM auctions;

-- If there are any auctions with invalid status values, we need to fix them
-- This would update any invalid status values to 'cancelled'
UPDATE auctions 
SET status = 'cancelled' 
WHERE status NOT IN ('active', 'ended', 'cancelled');

-- If the constraint itself is incorrect, we might need to drop and recreate it
-- First, let's see if we can drop the existing constraint
ALTER TABLE auctions 
DROP CONSTRAINT IF EXISTS auctions_status_check;

-- Then recreate it with the correct values
ALTER TABLE auctions 
ADD CONSTRAINT auctions_status_check 
CHECK (status IN ('active', 'ended', 'cancelled'));

-- Verify the constraint was created correctly
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