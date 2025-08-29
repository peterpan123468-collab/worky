-- Fix RLS Policies for User Registration
-- Run these commands in your Supabase SQL Editor to fix the registration issues

-- 1. Update the RLS policy to allow trigger functions to create user records
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    current_setting('role') = 'postgres' OR
    current_user = 'postgres'
  );

-- 2. Update the trigger function with proper security context and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    user_type_value TEXT;
BEGIN
    -- Try to get user_type from auth metadata, default to 'customer'
    user_type_value := COALESCE(
        (NEW.raw_user_meta_data->>'user_type'),
        'customer'
    );
    
    -- Ensure user_type is valid
    IF user_type_value NOT IN ('handyman', 'customer') THEN
        user_type_value := 'customer';
    END IF;
    
    -- Insert with security definer privileges
    INSERT INTO public.users (id, email, user_type)
    VALUES (NEW.id, NEW.email, user_type_value);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE WARNING 'Failed to create user record: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 3. Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Verify the changes by checking if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users';