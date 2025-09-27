-- =============================================
-- Quick Setup: Create tables and add test user
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (basic version for quick setup)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  user_type VARCHAR NOT NULL CHECK (user_type IN ('handyman', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add the test user (this will create a user in the users table)
-- Note: You still need to create the auth user through sign-up
-- This just ensures the user_type will be set correctly when they do

-- First, let's see if the auth user exists
DO $$
BEGIN
  -- If you want to add a user directly to the users table for testing:
  INSERT INTO users (id, email, user_type)
  VALUES (
    gen_random_uuid(),
    'atemndobs@gmail.com',
    'handyman'
  )
  ON CONFLICT (email) DO UPDATE SET user_type = 'handyman';
  
  RAISE NOTICE 'User atemndobs@gmail.com added as handyman to users table';
END
$$;