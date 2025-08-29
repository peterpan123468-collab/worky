-- Worky App Database Schema
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('handyman', 'customer')),
  profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handyman profiles table
CREATE TABLE IF NOT EXISTS public.handyman_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  skills TEXT[] DEFAULT '{}',
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Time slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  handyman_id UUID REFERENCES public.users(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in hours
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'auction', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slot_id UUID REFERENCES public.time_slots(id) NOT NULL,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  final_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auctions table (for Phase 2)
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slot_id UUID REFERENCES public.time_slots(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  current_bid DECIMAL(10,2),
  winning_customer_id UUID REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction bids table (for Phase 2)
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auction_id UUID REFERENCES public.auctions(id) NOT NULL,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('auction_started', 'outbid', 'auction_won', 'auction_lost', 'booking_confirmed', 'booking_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment intents table
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id TEXT PRIMARY KEY, -- Stripe payment intent ID
  booking_id UUID REFERENCES public.bookings(id) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  client_secret TEXT,
  payment_method_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  handyman_id UUID REFERENCES public.users(id) NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handyman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    current_setting('role') = 'postgres' OR
    current_user = 'postgres'
  );

-- Handyman profiles policies
DROP POLICY IF EXISTS "Anyone can view handyman profiles" ON public.handyman_profiles;
CREATE POLICY "Anyone can view handyman profiles" ON public.handyman_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Handymen can create own profile" ON public.handyman_profiles;
CREATE POLICY "Handymen can create own profile" ON public.handyman_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Handymen can update own profile" ON public.handyman_profiles;
CREATE POLICY "Handymen can update own profile" ON public.handyman_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Time slots policies
CREATE POLICY "Anyone can view available slots" ON public.time_slots
  FOR SELECT USING (true);

CREATE POLICY "Handymen can create own slots" ON public.time_slots
  FOR INSERT WITH CHECK (auth.uid() = handyman_id);

CREATE POLICY "Handymen can update own slots" ON public.time_slots
  FOR UPDATE USING (auth.uid() = handyman_id);

-- Bookings policies
CREATE POLICY "Users can view their bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (
      SELECT handyman_id FROM time_slots WHERE id = slot_id
    )
  );

CREATE POLICY "Customers can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Handymen can update booking status" ON public.bookings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT handyman_id FROM time_slots WHERE id = slot_id
    )
  );

-- Auctions policies (for Phase 2)
DROP POLICY IF EXISTS "Anyone can view active auctions" ON public.auctions;
CREATE POLICY "Anyone can view active auctions" ON public.auctions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their auction bids" ON public.auction_bids;
CREATE POLICY "Users can view their auction bids" ON public.auction_bids
  FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can create auction bids" ON public.auction_bids;
CREATE POLICY "Customers can create auction bids" ON public.auction_bids
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Payment intents policies
DROP POLICY IF EXISTS "Users can view own payment intents" ON public.payment_intents;
CREATE POLICY "Users can view own payment intents" ON public.payment_intents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT customer_id FROM bookings WHERE id = booking_id
    )
  );

DROP POLICY IF EXISTS "System can manage payment intents" ON public.payment_intents;
CREATE POLICY "System can manage payment intents" ON public.payment_intents
  FOR ALL WITH CHECK (true); -- Allow system to manage payment intents

-- Payouts policies
DROP POLICY IF EXISTS "Handymen can view own payouts" ON public.payouts;
CREATE POLICY "Handymen can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = handyman_id);

DROP POLICY IF EXISTS "System can manage payouts" ON public.payouts;
CREATE POLICY "System can manage payouts" ON public.payouts
  FOR ALL WITH CHECK (true); -- Allow system to manage payouts

-- Functions and triggers

-- Function to automatically create user profile on signup
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

-- Trigger to create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update slot status when booked
CREATE OR REPLACE FUNCTION public.handle_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
    existing_bookings_count INTEGER;
    slot_handyman_id UUID;
    slot_hourly_rate DECIMAL(10,2);
    slot_duration INTEGER;
BEGIN
    -- Check if there are existing bookings for this slot
    SELECT COUNT(*) INTO existing_bookings_count
    FROM public.bookings
    WHERE slot_id = NEW.slot_id AND status IN ('pending', 'confirmed');
    
    -- If this is the second booking for the same slot, start an auction
    IF existing_bookings_count >= 1 THEN
        -- Get slot details
        SELECT handyman_id, duration INTO slot_handyman_id, slot_duration
        FROM public.time_slots
        WHERE id = NEW.slot_id;
        
        -- Get handyman's hourly rate
        SELECT hourly_rate INTO slot_hourly_rate
        FROM public.handyman_profiles
        WHERE user_id = slot_handyman_id;
        
        -- Update slot status to auction
        UPDATE public.time_slots 
        SET status = 'auction' 
        WHERE id = NEW.slot_id;
        
        -- Create auction record
        INSERT INTO public.auctions (
            slot_id,
            start_time,
            end_time,
            starting_price,
            current_bid,
            status
        ) VALUES (
            NEW.slot_id,
            NOW(),
            NOW() + INTERVAL '10 minutes', -- 10-minute auction window
            slot_hourly_rate * slot_duration,
            slot_hourly_rate * slot_duration,
            'active'
        );
        
        -- Convert all pending bookings for this slot to auction bids
        INSERT INTO public.auction_bids (auction_id, customer_id, bid_amount, created_at)
        SELECT 
            (SELECT id FROM public.auctions WHERE slot_id = NEW.slot_id ORDER BY created_at DESC LIMIT 1),
            customer_id,
            final_price,
            created_at
        FROM public.bookings
        WHERE slot_id = NEW.slot_id AND status = 'pending';
        
        -- Delete the pending bookings as they're now auction bids
        DELETE FROM public.bookings
        WHERE slot_id = NEW.slot_id AND status = 'pending';
        
        -- Set the current booking as cancelled since it triggered an auction
        UPDATE public.bookings SET status = 'cancelled' WHERE id = NEW.id;
        
        RETURN NULL; -- Don't insert the original booking
    ELSE
        -- First booking - proceed normally and update slot status
        UPDATE public.time_slots 
        SET status = 'booked' 
        WHERE id = NEW.slot_id;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle auction completion
CREATE OR REPLACE FUNCTION public.complete_auction(auction_id_param UUID)
RETURNS VOID AS $$
DECLARE
    winning_bid RECORD;
    auction_slot_id UUID;
BEGIN
    -- Get the auction details
    SELECT slot_id INTO auction_slot_id
    FROM public.auctions
    WHERE id = auction_id_param;
    
    -- Find the highest bid
    SELECT ab.customer_id, ab.bid_amount, ab.created_at
    INTO winning_bid
    FROM public.auction_bids ab
    WHERE ab.auction_id = auction_id_param
    ORDER BY ab.bid_amount DESC, ab.created_at ASC
    LIMIT 1;
    
    IF winning_bid IS NOT NULL THEN
        -- Create winning booking
        INSERT INTO public.bookings (
            slot_id,
            customer_id,
            status,
            final_price
        ) VALUES (
            auction_slot_id,
            winning_bid.customer_id,
            'confirmed',
            winning_bid.bid_amount
        );
        
        -- Update auction status
        UPDATE public.auctions
        SET 
            status = 'completed',
            winning_customer_id = winning_bid.customer_id,
            current_bid = winning_bid.bid_amount
        WHERE id = auction_id_param;
        
        -- Update slot status
        UPDATE public.time_slots
        SET status = 'booked'
        WHERE id = auction_slot_id;
    ELSE
        -- No bids, mark auction as cancelled and slot as available
        UPDATE public.auctions
        SET status = 'cancelled'
        WHERE id = auction_id_param;
        
        UPDATE public.time_slots
        SET status = 'available'
        WHERE id = auction_slot_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle booking conflicts and auctions
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_booking_conflict();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_slots_handyman_id ON public.time_slots(handyman_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON public.time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON public.time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON public.bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_handyman_profiles_user_id ON public.handyman_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_auctions_slot_id ON public.auctions(slot_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_customer_id ON public.auction_bids(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking_id ON public.payment_intents(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON public.payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payouts_handyman_id ON public.payouts(handyman_id);
CREATE INDEX IF NOT EXISTS idx_payouts_booking_id ON public.payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);