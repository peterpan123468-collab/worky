-- Migration script to add language preferences to user profiles
-- This script adds language columns to handyman_profiles and customer_profiles tables

-- Add language column to handyman_profiles table
ALTER TABLE handyman_profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Add language column to customer_profiles table
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_handyman_profiles_language ON handyman_profiles(language);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_language ON customer_profiles(language);

-- Update existing records to have default language if null
UPDATE handyman_profiles 
SET language = 'en' 
WHERE language IS NULL;

UPDATE customer_profiles 
SET language = 'en' 
WHERE language IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN handyman_profiles.language IS 'User language preference (en, de, fr, it)';
COMMENT ON COLUMN customer_profiles.language IS 'User language preference (en, de, fr, it)';