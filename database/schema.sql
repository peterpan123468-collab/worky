-- =============================================
-- WORKY DATABASE SCHEMA - User Journey Aligned
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES (Existing + Enhanced)
-- =============================================

-- Users table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  user_type VARCHAR NOT NULL CHECK (user_type IN ('handyman', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Handyman profiles table (Enhanced)
CREATE TABLE IF NOT EXISTS handyman_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  region VARCHAR NOT NULL,
  skills TEXT[] NOT NULL,
  description TEXT,
  phone VARCHAR,
  -- New auction-specific fields
  default_auction_duration INTEGER DEFAULT 60, -- minutes
  min_bid_increment DECIMAL(10,2) DEFAULT 5.00,
  calendar_integration_enabled BOOLEAN DEFAULT false,
  auto_confirm_calendar_bookings BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time slots table (Enhanced for calendar integration)
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'open' CHECK (status IN ('open', 'booked', 'auction', 'canceled')),
  -- New calendar integration fields
  calendar_event_id VARCHAR,
  is_synced_to_calendar BOOLEAN DEFAULT false,
  booking_type VARCHAR DEFAULT 'calendar' CHECK (booking_type IN ('calendar', 'auction', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table (Enhanced for auction support)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  handyman_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
  total_price DECIMAL(10,2) NOT NULL,
  work_description TEXT,
  customer_address VARCHAR NOT NULL,
  -- New auction-specific fields
  booking_type VARCHAR DEFAULT 'calendar' CHECK (booking_type IN ('calendar', 'auction')),
  auction_id UUID, -- Will reference auctions table
  winning_bid_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NEW TABLES FOR USER JOURNEYS
-- =============================================

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  service_type VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  starting_price DECIMAL(10,2) NOT NULL,
  reserve_price DECIMAL(10,2),
  current_highest_bid DECIMAL(10,2) DEFAULT 0,
  current_highest_bidder_id UUID REFERENCES users(id),
  bid_increment DECIMAL(10,2) DEFAULT 5.00,
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  winner_id UUID REFERENCES users(id),
  auto_extend BOOLEAN DEFAULT false,
  auto_extend_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auction bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_time TIMESTAMPTZ DEFAULT NOW(),
  is_winning_bid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN (
    'auction_outbid', 
    'auction_won', 
    'auction_ended', 
    'auction_lost',
    'booking_confirmed', 
    'booking_cancelled',
    'booking_completed',
    'calendar_booking_request',
    'auction_ending_soon'
  )),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handyman_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Add foreign key constraint for auction_id in bookings table
ALTER TABLE bookings 
ADD CONSTRAINT fk_bookings_auction_id 
FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);

-- Handyman profiles indexes
CREATE INDEX IF NOT EXISTS idx_handyman_profiles_user_id ON handyman_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_handyman_profiles_region ON handyman_profiles(region);
CREATE INDEX IF NOT EXISTS idx_handyman_profiles_skills ON handyman_profiles USING GIN(skills);

-- Time slots indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_handyman_id ON time_slots(handyman_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);
CREATE INDEX IF NOT EXISTS idx_time_slots_booking_type ON time_slots(booking_type);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_handyman_id ON bookings(handyman_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_auction_id ON bookings(auction_id);

-- Auctions indexes
CREATE INDEX IF NOT EXISTS idx_auctions_handyman_id ON auctions(handyman_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON auctions(ends_at);
CREATE INDEX IF NOT EXISTS idx_auctions_region ON auctions(region);
CREATE INDEX IF NOT EXISTS idx_auctions_service_type ON auctions(service_type);

-- Auction bids indexes
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bid_time ON auction_bids(bid_time);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Calendar integrations indexes
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_handyman_id ON calendar_integrations(handyman_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(calendar_provider);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE handyman_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Handyman profiles policies
CREATE POLICY "Anyone can view handyman profiles" ON handyman_profiles
  FOR SELECT USING (true);

CREATE POLICY "Handymen can manage own profile" ON handyman_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Time slots policies
CREATE POLICY "Anyone can view open time slots" ON time_slots
  FOR SELECT USING (status IN ('open', 'auction'));

CREATE POLICY "Handymen can manage own time slots" ON time_slots
  FOR ALL USING (auth.uid() = handyman_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = handyman_id);

CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Handymen and customers can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = customer_id OR auth.uid() = handyman_id);

-- Auctions policies
CREATE POLICY "Anyone can view active auctions" ON auctions
  FOR SELECT USING (status = 'active' OR auth.uid() = handyman_id);

CREATE POLICY "Handymen can create own auctions" ON auctions
  FOR INSERT WITH CHECK (auth.uid() = handyman_id);

CREATE POLICY "Handymen can manage own auctions" ON auctions
  FOR ALL USING (auth.uid() = handyman_id);

-- Auction bids policies
CREATE POLICY "Users can view auction bids" ON auction_bids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auctions 
      WHERE auctions.id = auction_bids.auction_id 
      AND (auctions.status = 'active' OR auctions.handyman_id = auth.uid())
    )
  );

CREATE POLICY "Customers can place bids" ON auction_bids
  FOR INSERT WITH CHECK (
    auth.uid() = bidder_id 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'customer'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Calendar integrations policies
CREATE POLICY "Handymen can manage own calendar integrations" ON calendar_integrations
  FOR ALL USING (auth.uid() = handyman_id);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

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

-- Function to place a bid on an auction
CREATE OR REPLACE FUNCTION place_auction_bid(
  auction_id_param UUID,
  bidder_id_param UUID,
  bid_amount_param DECIMAL
)
RETURNS JSON AS $$
DECLARE
  auction_record auctions%ROWTYPE;
  previous_highest_bid DECIMAL;
  result JSON;
BEGIN
  -- Get auction details with row lock
  SELECT * INTO auction_record
  FROM auctions
  WHERE id = auction_id_param
  AND status = 'active'
  AND ends_at > NOW()
  FOR UPDATE;

  -- Check if auction exists and is active
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Auction not found or ended');
  END IF;

  -- Check if bid meets minimum requirements
  IF bid_amount_param < auction_record.current_highest_bid + auction_record.bid_increment THEN
    RETURN json_build_object('success', false, 'error', 'Bid too low');
  END IF;

  -- Check if bid meets reserve price (if set)
  IF auction_record.reserve_price IS NOT NULL AND bid_amount_param < auction_record.reserve_price THEN
    RETURN json_build_object('success', false, 'error', 'Bid below reserve price');
  END IF;

  -- Store previous highest bid for notifications
  previous_highest_bid := auction_record.current_highest_bid;

  -- Mark previous winning bid as no longer winning
  UPDATE auction_bids 
  SET is_winning_bid = false 
  WHERE auction_id = auction_id_param AND is_winning_bid = true;

  -- Insert new bid
  INSERT INTO auction_bids (auction_id, bidder_id, bid_amount, is_winning_bid)
  VALUES (auction_id_param, bidder_id_param, bid_amount_param, true);

  -- Update auction with new highest bid
  UPDATE auctions
  SET 
    current_highest_bid = bid_amount_param,
    current_highest_bidder_id = bidder_id_param,
    updated_at = NOW()
  WHERE id = auction_id_param;

  -- Create outbid notification for previous highest bidder
  IF auction_record.current_highest_bidder_id IS NOT NULL 
     AND auction_record.current_highest_bidder_id != bidder_id_param THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      auction_record.current_highest_bidder_id,
      'auction_outbid',
      'You have been outbid',
      'Someone placed a higher bid on "' || auction_record.title || '"',
      json_build_object(
        'auction_id', auction_id_param,
        'new_bid_amount', bid_amount_param,
        'previous_bid_amount', previous_highest_bid
      )
    );
  END IF;

  -- Auto-extend auction if enabled and bid placed in last few minutes
  IF auction_record.auto_extend 
     AND auction_record.ends_at <= NOW() + INTERVAL '5 minutes' THEN
    UPDATE auctions
    SET ends_at = GREATEST(ends_at, NOW() + INTERVAL '5 minutes')
    WHERE id = auction_id_param;
  END IF;

  result := json_build_object(
    'success', true,
    'bid_id', (SELECT id FROM auction_bids WHERE auction_id = auction_id_param AND bidder_id = bidder_id_param ORDER BY bid_time DESC LIMIT 1),
    'new_highest_bid', bid_amount_param
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to close expired auctions
CREATE OR REPLACE FUNCTION close_expired_auctions()
RETURNS void AS $$
DECLARE
  expired_auction auctions%ROWTYPE;
BEGIN
  -- Process each expired auction
  FOR expired_auction IN
    SELECT * FROM auctions
    WHERE status = 'active' AND ends_at <= NOW()
  LOOP
    -- Update auction status
    UPDATE auctions 
    SET 
      status = 'ended', 
      winner_id = expired_auction.current_highest_bidder_id,
      updated_at = NOW()
    WHERE id = expired_auction.id;

    -- Create booking if there's a winner and reserve price is met
    IF expired_auction.current_highest_bidder_id IS NOT NULL 
       AND (expired_auction.reserve_price IS NULL 
            OR expired_auction.current_highest_bid >= expired_auction.reserve_price) THEN
      
      -- Create booking for auction winner
      INSERT INTO bookings (
        customer_id,
        handyman_id,
        status,
        total_price,
        booking_type,
        auction_id,
        winning_bid_amount,
        customer_address,
        work_description
      ) VALUES (
        expired_auction.current_highest_bidder_id,
        expired_auction.handyman_id,
        'confirmed', -- Auction wins auto-confirm
        expired_auction.current_highest_bid,
        'auction',
        expired_auction.id,
        expired_auction.current_highest_bid,
        'Address to be provided', -- Customer will update this
        expired_auction.description
      );

      -- Notify winner
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        expired_auction.current_highest_bidder_id,
        'auction_won',
        'Congratulations! You won the auction',
        'You won the auction for "' || expired_auction.title || '"',
        json_build_object(
          'auction_id', expired_auction.id,
          'winning_bid', expired_auction.current_highest_bid
        )
      );

      -- Notify handyman
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        expired_auction.handyman_id,
        'auction_ended',
        'Your auction has ended',
        'Your auction "' || expired_auction.title || '" was won for CHF ' || expired_auction.current_highest_bid,
        json_build_object(
          'auction_id', expired_auction.id,
          'winning_bid', expired_auction.current_highest_bid,
          'winner_id', expired_auction.current_highest_bidder_id
        )
      );
    END IF;

    -- Notify other bidders that auction ended
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      DISTINCT ab.bidder_id,
      'auction_lost',
      'Auction ended',
      'The auction for "' || expired_auction.title || '" has ended',
      json_build_object(
        'auction_id', expired_auction.id,
        'winning_bid', expired_auction.current_highest_bid
      )
    FROM auction_bids ab
    WHERE ab.auction_id = expired_auction.id
    AND ab.bidder_id != COALESCE(expired_auction.current_highest_bidder_id, '00000000-0000-0000-0000-000000000000'::UUID);

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handyman_profiles_updated_at
  BEFORE UPDATE ON handyman_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auctions_updated_at
  BEFORE UPDATE ON auctions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA / SEED DATA
-- =============================================

-- Swiss regions
INSERT INTO handyman_profiles (user_id, business_name, hourly_rate, region, skills, description) VALUES
-- These will be populated when handymen register
-- Adding sample skills for reference:
-- ['plumbing', 'electrical', 'carpentry', 'painting', 'heating', 'general_maintenance']
ON CONFLICT DO NOTHING;

-- Sample notification types for reference (these don't need to be inserted)
/*
Notification Types:
- auction_outbid: When user is outbid on an auction
- auction_won: When user wins an auction
- auction_ended: When auction ends (for handyman)
- auction_lost: When auction ends and user didn't win
- booking_confirmed: When booking is confirmed
- booking_cancelled: When booking is cancelled
- booking_completed: When service is completed
- calendar_booking_request: When customer books via calendar
- auction_ending_soon: 5 minutes before auction ends
*/