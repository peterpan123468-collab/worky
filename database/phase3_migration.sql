-- =============================================
-- Phase 3 Migration: Auctions + Bids + Notifications
-- Idempotent migration that aligns a live DB with the app schema.
-- Safe to run multiple times. Uses IF NOT EXISTS and guarded renames.
-- Paste into Supabase SQL editor or run via your migration process.
-- =============================================

-- Extensions (safe if already installed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Core tables (ensure presence)
-- =============================================

-- users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  user_type VARCHAR NOT NULL CHECK (user_type IN ('handyman', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- handyman_profiles
CREATE TABLE IF NOT EXISTS public.handyman_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  region VARCHAR NOT NULL,
  skills TEXT[] NOT NULL,
  description TEXT,
  phone VARCHAR,
  default_auction_duration INTEGER DEFAULT 60,
  min_bid_increment DECIMAL(10,2) DEFAULT 5.00,
  calendar_integration_enabled BOOLEAN DEFAULT false,
  auto_confirm_calendar_bookings BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- time_slots
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'booked', 'auction', 'canceled')),
  calendar_event_id VARCHAR,
  is_synced_to_calendar BOOLEAN DEFAULT false,
  booking_type VARCHAR DEFAULT 'calendar' CHECK (booking_type IN ('calendar', 'auction', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES public.time_slots(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  handyman_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
  total_price DECIMAL(10,2) NOT NULL,
  work_description TEXT,
  customer_address VARCHAR NOT NULL,
  booking_type VARCHAR DEFAULT 'calendar' CHECK (booking_type IN ('calendar', 'auction')),
  auction_id UUID,
  winning_bid_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from bookings.auction_id → auctions later after auctions exists

-- Ensure bookings has Phase 3 columns even if table already existed
-- Guarded renames for legacy schemas
DO $$ BEGIN
  -- If legacy column names exist, rename to match app schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='provider_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='handyman_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings RENAME COLUMN provider_id TO handyman_id';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='service_provider_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='handyman_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings RENAME COLUMN service_provider_id TO handyman_id';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='customer_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings RENAME COLUMN user_id TO customer_id';
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS handyman_id UUID,
  ADD COLUMN IF NOT EXISTS auction_id UUID,
  ADD COLUMN IF NOT EXISTS winning_bid_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS work_description TEXT,
  ADD COLUMN IF NOT EXISTS customer_address VARCHAR,
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR;

-- Helpful index for lookups by auction
CREATE INDEX IF NOT EXISTS idx_bookings_auction_id ON public.bookings(auction_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_handyman_id ON public.bookings(handyman_id);

-- Guarded FKs for bookings → users/auctions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.conname = 'bookings_customer_id_fkey' AND c.conrelid = 'public.bookings'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.conname = 'bookings_handyman_id_fkey' AND c.conrelid = 'public.bookings'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='handyman_id'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_handyman_id_fkey FOREIGN KEY (handyman_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- Auctions domain (tables, indexes, policies)
-- =============================================

-- Create auctions table if missing (complete definition)
CREATE TABLE IF NOT EXISTS public.auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  service_type VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  reserve_price DECIMAL(10,2),
  current_highest_bid DECIMAL(10,2) DEFAULT 0,
  current_highest_bidder_id UUID REFERENCES public.users(id),
  bid_increment DECIMAL(10,2) DEFAULT 5.00,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  winner_id UUID REFERENCES public.users(id),
  auto_extend BOOLEAN DEFAULT false,
  auto_extend_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Column renames to align with app (guarded)
DO $$ BEGIN
  -- Rename current_bid → current_highest_bid if target doesn't already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auctions' AND column_name='current_bid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auctions' AND column_name='current_highest_bid'
  ) THEN
    EXECUTE 'ALTER TABLE public.auctions RENAME COLUMN current_bid TO current_highest_bid';
  END IF;
  -- Rename winning_customer_id → winner_id if target doesn't already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auctions' AND column_name='winning_customer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auctions' AND column_name='winner_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.auctions RENAME COLUMN winning_customer_id TO winner_id';
  END IF;
END $$;

-- Add any missing columns (idempotent)
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS handyman_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS service_type VARCHAR,
  ADD COLUMN IF NOT EXISTS region VARCHAR,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS starting_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS reserve_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS current_highest_bid DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_highest_bidder_id UUID,
  ADD COLUMN IF NOT EXISTS bid_increment DECIMAL(10,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS winner_id UUID,
  ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_extend_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure FKs exist (guarded by constraint checks)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'fk_auctions_handyman_id' AND c.conrelid = 'public.auctions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auctions' AND column_name='handyman_id'
  ) THEN
    ALTER TABLE public.auctions
      ADD CONSTRAINT fk_auctions_handyman_id FOREIGN KEY (handyman_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'fk_auctions_highest_bidder_id' AND c.conrelid = 'public.auctions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auctions' AND column_name='current_highest_bidder_id'
  ) THEN
    ALTER TABLE public.auctions
      ADD CONSTRAINT fk_auctions_highest_bidder_id FOREIGN KEY (current_highest_bidder_id) REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'fk_auctions_winner_id' AND c.conrelid = 'public.auctions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auctions' AND column_name='winner_id'
  ) THEN
    ALTER TABLE public.auctions
      ADD CONSTRAINT fk_auctions_winner_id FOREIGN KEY (winner_id) REFERENCES public.users(id);
  END IF;
END $$;

-- Backfill ends_at if missing
UPDATE public.auctions SET ends_at = end_time WHERE ends_at IS NULL AND end_time IS NOT NULL;

-- Auction indexes
CREATE INDEX IF NOT EXISTS idx_auctions_handyman_id ON public.auctions(handyman_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON public.auctions(ends_at);
CREATE INDEX IF NOT EXISTS idx_auctions_region ON public.auctions(region);
CREATE INDEX IF NOT EXISTS idx_auctions_service_type ON public.auctions(service_type);

-- auction_bids table
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT NOW(),
  is_winning_bid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guarded renames to align legacy columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auction_bids' AND column_name='user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auction_bids' AND column_name='bidder_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.auction_bids RENAME COLUMN user_id TO bidder_id';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auction_bids' AND column_name='customer_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auction_bids' AND column_name='bidder_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.auction_bids RENAME COLUMN customer_id TO bidder_id';
  END IF;
END $$;

-- Ensure required columns exist for legacy tables
ALTER TABLE public.auction_bids
  ADD COLUMN IF NOT EXISTS auction_id UUID,
  ADD COLUMN IF NOT EXISTS bidder_id UUID,
  ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bid_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_winning_bid BOOLEAN,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Ensure foreign keys exist for legacy tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'auction_bids_auction_id_fkey' AND c.conrelid = 'public.auction_bids'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auction_bids' AND column_name='auction_id'
  ) THEN
    ALTER TABLE public.auction_bids 
      ADD CONSTRAINT auction_bids_auction_id_fkey FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'auction_bids_bidder_id_fkey' AND c.conrelid = 'public.auction_bids'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auction_bids' AND column_name='bidder_id'
  ) THEN
    ALTER TABLE public.auction_bids 
      ADD CONSTRAINT auction_bids_bidder_id_fkey FOREIGN KEY (bidder_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON public.auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bid_time ON public.auction_bids(bid_time);

-- If legacy schemas enforced NOT NULL on auctions.slot_id, relax it
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='auctions' AND column_name='slot_id' AND is_nullable='NO'
  ) THEN
    EXECUTE 'ALTER TABLE public.auctions ALTER COLUMN slot_id DROP NOT NULL';
  END IF;
END $$;

-- notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN (
    'auction_outbid', 'auction_won', 'auction_ended', 'auction_lost',
    'booking_confirmed', 'booking_cancelled', 'booking_completed',
    'calendar_booking_request', 'auction_ending_soon'
  )),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- calendar_integrations (optional but included for completeness)
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  calendar_provider VARCHAR NOT NULL CHECK (calendar_provider IN ('google', 'apple', 'outlook', 'other')),
  external_calendar_id VARCHAR NOT NULL,
  calendar_name VARCHAR,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(handyman_id, calendar_provider, external_calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_handyman_id ON public.calendar_integrations(handyman_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON public.calendar_integrations(calendar_provider);

-- Add FK from bookings.auction_id → auctions (guarded)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c 
    WHERE c.conname = 'fk_bookings_auction_id' AND c.conrelid = 'public.bookings'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='auction_id'
  ) THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT fk_bookings_auction_id FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- RLS enablement and policies (guarded)
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handyman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Helper to create policy if missing
DO $$ BEGIN
  -- Users policies
  BEGIN
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Handyman profiles
  BEGIN
    CREATE POLICY "Anyone can view handyman profiles" ON public.handyman_profiles FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Handymen can manage own profile" ON public.handyman_profiles FOR ALL USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Time slots
  BEGIN
    CREATE POLICY "Anyone can view open time slots" ON public.time_slots FOR SELECT USING (status IN ('open', 'auction'));
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Handymen can manage own time slots" ON public.time_slots FOR ALL USING (auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Bookings
  BEGIN
    CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Handymen and customers can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Auctions
  BEGIN
    CREATE POLICY "Anyone can view active auctions" ON public.auctions FOR SELECT USING (status = 'active' OR auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Handymen can create own auctions" ON public.auctions FOR INSERT WITH CHECK (auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Handymen can manage own auctions" ON public.auctions FOR ALL USING (auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Auction bids
  BEGIN
    CREATE POLICY "Users can view auction bids" ON public.auction_bids
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.auctions a
          WHERE a.id = auction_bids.auction_id
          AND (a.status = 'active' OR a.handyman_id = auth.uid())
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Customers can place bids" ON public.auction_bids
      FOR INSERT WITH CHECK (
        auth.uid() = bidder_id AND EXISTS (
          SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.user_type = 'customer'
        )
      );
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Notifications
  BEGIN
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  -- Calendar integrations
  BEGIN
    CREATE POLICY "Handymen can manage own calendar integrations" ON public.calendar_integrations FOR ALL USING (auth.uid() = handyman_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================
-- Functions and triggers (aligned with app expectations)
-- =============================================

-- Insert a row into public.users when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create/replace place_auction_bid with argument names used by the app
-- Drop older conflicting signatures if present (safe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname='public' AND p.proname='place_auction_bid' AND p.pronargs=3
  ) THEN
    DROP FUNCTION public.place_auction_bid(uuid, uuid, numeric);
  END IF;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_auction_id UUID,
  p_bidder_id UUID,
  p_bid_amount NUMERIC,
  p_max_auto_bid NUMERIC DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_auction public.auctions%ROWTYPE;
  v_prev_highest NUMERIC;
  v_new_bid_id UUID;
BEGIN
  SELECT * INTO v_auction
  FROM public.auctions
  WHERE id = p_auction_id
    AND status = 'active'
    AND ends_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Auction not found or ended');
  END IF;

  IF p_bid_amount < COALESCE(v_auction.current_highest_bid, 0) + COALESCE(v_auction.bid_increment, 0) THEN
    RETURN json_build_object('success', false, 'error', 'Bid too low');
  END IF;

  IF v_auction.reserve_price IS NOT NULL AND p_bid_amount < v_auction.reserve_price THEN
    RETURN json_build_object('success', false, 'error', 'Bid below reserve price');
  END IF;

  v_prev_highest := COALESCE(v_auction.current_highest_bid, 0);

  UPDATE public.auction_bids SET is_winning_bid = false
  WHERE auction_id = p_auction_id AND is_winning_bid = true;

  INSERT INTO public.auction_bids (auction_id, bidder_id, bid_amount, is_winning_bid)
  VALUES (p_auction_id, p_bidder_id, p_bid_amount, true)
  RETURNING id INTO v_new_bid_id;

  UPDATE public.auctions
  SET
    current_highest_bid = p_bid_amount,
    current_highest_bidder_id = p_bidder_id,
    updated_at = NOW(),
    ends_at = CASE
      WHEN auto_extend IS TRUE AND ends_at <= NOW() + make_interval(mins => COALESCE(auto_extend_minutes, 5)) THEN
        GREATEST(ends_at, NOW() + make_interval(mins => COALESCE(auto_extend_minutes, 5)))
      ELSE ends_at
    END
  WHERE id = p_auction_id;

  IF v_auction.current_highest_bidder_id IS NOT NULL AND v_auction.current_highest_bidder_id <> p_bidder_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_auction.current_highest_bidder_id,
      'auction_outbid',
      'You have been outbid',
      'Someone placed a higher bid on "' || v_auction.title || '"',
      json_build_object(
        'auction_id', p_auction_id,
        'new_bid_amount', p_bid_amount,
        'previous_bid_amount', v_prev_highest
      )
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'bid_id', v_new_bid_id,
    'new_highest_bid', p_bid_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Close expired auctions; return number processed (aligned with types)
CREATE OR REPLACE FUNCTION public.close_expired_auctions()
RETURNS TABLE(processed_count INTEGER) AS $$
DECLARE
  v_row public.auctions%ROWTYPE;
  v_processed INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM public.auctions
    WHERE status = 'active' AND ends_at <= NOW()
  LOOP
    UPDATE public.auctions
    SET status = 'ended',
        winner_id = v_row.current_highest_bidder_id,
        updated_at = NOW()
    WHERE id = v_row.id;

    IF v_row.current_highest_bidder_id IS NOT NULL
       AND (v_row.reserve_price IS NULL OR v_row.current_highest_bid >= v_row.reserve_price) THEN
      INSERT INTO public.bookings (
        customer_id, handyman_id, status, total_price, booking_type,
        auction_id, winning_bid_amount, customer_address, work_description
      ) VALUES (
        v_row.current_highest_bidder_id, v_row.handyman_id, 'confirmed', v_row.current_highest_bid, 'auction',
        v_row.id, v_row.current_highest_bid, 'Address to be provided', v_row.description
      );

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        v_row.current_highest_bidder_id, 'auction_won', 'Congratulations! You won the auction',
        'You won the auction for "' || v_row.title || '"',
        json_build_object('auction_id', v_row.id, 'winning_bid', v_row.current_highest_bid)
      );

      INSERT INTO public.notifications (user_id, type, title, message, data)
      VALUES (
        v_row.handyman_id, 'auction_ended', 'Your auction has ended',
        'Your auction "' || v_row.title || '" was won for CHF ' || v_row.current_highest_bid,
        json_build_object('auction_id', v_row.id, 'winning_bid', v_row.current_highest_bid, 'winner_id', v_row.current_highest_bidder_id)
      );
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT DISTINCT ab.bidder_id, 'auction_lost', 'Auction ended',
      'The auction for "' || v_row.title || '" has ended',
      json_build_object('auction_id', v_row.id, 'winning_bid', v_row.current_highest_bid)
    FROM public.auction_bids ab
    WHERE ab.auction_id = v_row.id
      AND ab.bidder_id <> COALESCE(v_row.current_highest_bidder_id, '00000000-0000-0000-0000-000000000000'::UUID);

    v_processed := v_processed + 1;
  END LOOP;

  RETURN QUERY SELECT v_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_auctions_updated_at'
  ) THEN
    CREATE TRIGGER update_auctions_updated_at
      BEFORE UPDATE ON public.auctions
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at'
  ) THEN
    CREATE TRIGGER update_bookings_updated_at
      BEFORE UPDATE ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_slots_updated_at'
  ) THEN
    CREATE TRIGGER update_time_slots_updated_at
      BEFORE UPDATE ON public.time_slots
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_handyman_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_handyman_profiles_updated_at
      BEFORE UPDATE ON public.handyman_profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger to mirror auth.users → public.users (guarded)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- =============================================
-- Refresh PostgREST schema cache
-- =============================================
NOTIFY pgrst, 'reload schema';
