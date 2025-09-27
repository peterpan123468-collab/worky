# Auction System Specification

This document provides a comprehensive specification for the Worky real-time auction system, detailing the implementation requirements for handyman service auctions in the Swiss market.

**Note**: The SQL schemas and database functions in this document are illustrative and may differ from the actual database implementation. For the definitive database schema, refer to `database/schema.sql` in the project root. Any discrepancies between this specification and the actual implementation should be documented in a "Schema Differences" section below.

## Overview

The auction system enables handymen to create time-limited auctions for their services, allowing customers to bid in real-time. This creates a dynamic pricing mechanism while ensuring handymen can maximize their earning potential during high-demand periods.

## Business Rules

### Auction Creation (Handyman)
- **Service Definition**: Handymen specify service type, duration, and location
- **Pricing Structure**: Starting price (minimum CHF 20), optional reserve price
- **Duration Options**: 15 minutes, 30 minutes, 1 hour, 2 hours, 4 hours, 24 hours
- **Scheduling**: Auctions can be scheduled for future dates or start immediately
- **Auto-extend**: Optional 5-minute extension when bid received in final 2 minutes

### Bidding Rules (Customer)
- **Minimum Increment**: CHF 5 per bid increase
- **Maximum Bid**: Optional maximum bid with auto-bidding functionality
- **Bid Retraction**: Not allowed once placed (final sale)
- **Winner Selection**: Highest valid bid when auction expires
- **Payment**: Winner commits to booking at winning bid amount

### Swiss Market Requirements
- **Currency**: All prices in Swiss Francs (CHF)
- **Business Hours**: Auctions during business hours (8:00-18:00) preferred
- **Holiday Restrictions**: No auctions on major Swiss holidays
- **Service Areas**: Canton-based service area restrictions
- **Language**: Multi-language support (German, French, Italian)

## Database Schema Integration

### Core Tables

#### auctions
```sql
CREATE TABLE auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  handyman_id UUID REFERENCES users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  service_category VARCHAR(100) NOT NULL,

  -- Pricing
  starting_price DECIMAL(10,2) NOT NULL CHECK (starting_price >= 20.00),
  reserve_price DECIMAL(10,2) CHECK (reserve_price >= starting_price),
  current_highest_bid DECIMAL(10,2) DEFAULT NULL,

  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (ends_at - starts_at)) / 60
  ) STORED,
  auto_extend BOOLEAN DEFAULT false,

  -- Location and service
  service_location JSONB NOT NULL, -- {address, coordinates, radius}
  estimated_duration INTEGER NOT NULL, -- minutes

  -- Status and metadata
  status auction_status NOT NULL DEFAULT 'scheduled',
  winner_id UUID REFERENCES users(id) DEFAULT NULL,
  total_bids INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_auction_duration CHECK (
    EXTRACT(EPOCH FROM (ends_at - starts_at)) / 60 BETWEEN 15 AND 1440
  ),
  CONSTRAINT future_start_time CHECK (starts_at >= NOW()),
  CONSTRAINT valid_end_time CHECK (ends_at > starts_at)
);

-- Enum for auction status
CREATE TYPE auction_status AS ENUM (
  'scheduled',    -- Created but not yet active
  'active',       -- Currently accepting bids
  'extended',     -- Auto-extended due to late bid
  'ended',        -- Completed, determining winner
  'completed',    -- Winner selected, booking created
  'cancelled'     -- Cancelled by handyman
);
```

#### auction_bids
```sql
CREATE TABLE auction_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES users(id) NOT NULL,

  -- Bid details
  bid_amount DECIMAL(10,2) NOT NULL,
  previous_highest_bid DECIMAL(10,2) DEFAULT NULL,
  is_auto_bid BOOLEAN DEFAULT false,
  max_auto_bid DECIMAL(10,2) DEFAULT NULL,

  -- Metadata
  bid_time TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Constraints
  CONSTRAINT positive_bid_amount CHECK (bid_amount > 0),
  CONSTRAINT valid_increment CHECK (
    previous_highest_bid IS NULL OR
    bid_amount >= previous_highest_bid + 5.00
  )
);
```

### Database Functions

#### place_auction_bid()
```sql
CREATE OR REPLACE FUNCTION place_auction_bid(
  p_auction_id UUID,
  p_bidder_id UUID,
  p_bid_amount DECIMAL(10,2),
  p_max_auto_bid DECIMAL(10,2) DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
-- SECURITY DEFINER removed to maintain RLS enforcement
-- Function executes with caller's privileges, ensuring RLS policies apply
-- ALTER FUNCTION place_auction_bid(UUID, UUID, DECIMAL, DECIMAL) OWNER TO postgres;
AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_current_highest DECIMAL(10,2);
  v_minimum_bid DECIMAL(10,2);
  v_new_bid_id UUID;
  v_previous_winner UUID;
  v_auto_bid_triggered BOOLEAN := false;
BEGIN
  -- Lock the auction for update
  SELECT * INTO v_auction
  FROM auctions
  WHERE id = p_auction_id
  FOR UPDATE;

  -- Validate auction exists and is active
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
  END IF;

  IF v_auction.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction not active');
  END IF;

  -- Check if auction has ended
  IF NOW() > v_auction.ends_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auction has ended');
  END IF;

  -- Validate bidder is not the handyman
  IF p_bidder_id = v_auction.handyman_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot bid on own auction');
  END IF;

  -- Calculate minimum bid
  v_current_highest := COALESCE(v_auction.current_highest_bid, 0);
  IF v_current_highest = 0 THEN
    v_minimum_bid := v_auction.starting_price;
  ELSE
    v_minimum_bid := v_current_highest + 5.00;
  END IF;

  -- Validate bid amount
  IF p_bid_amount < v_minimum_bid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bid must be at least CHF ' || v_minimum_bid::TEXT
    );
  END IF;

  -- Store previous winner before update
  v_previous_winner := v_auction.winner_id;

  -- Insert the bid
  INSERT INTO auction_bids (
    auction_id, bidder_id, bid_amount, previous_highest_bid,
    is_auto_bid, max_auto_bid
  ) VALUES (
    p_auction_id, p_bidder_id, p_bid_amount, v_current_highest,
    p_max_auto_bid IS NOT NULL, p_max_auto_bid
  )
  RETURNING id INTO v_new_bid_id;

  -- Update auction with new highest bid
  UPDATE auctions
  SET
    current_highest_bid = p_bid_amount,
    winner_id = p_bidder_id,
    total_bids = total_bids + 1,
    updated_at = NOW()
  WHERE id = p_auction_id;

  -- Check for auto-extend (if bid placed in final 2 minutes)
  IF v_auction.auto_extend AND
     v_auction.ends_at - NOW() <= interval '2 minutes' THEN

    UPDATE auctions
    SET
      ends_at = ends_at + interval '5 minutes',
      status = 'extended'
    WHERE id = p_auction_id;

    -- Notify about extension
    INSERT INTO notifications (
      user_id, type, title, message, reference_id
    )
    SELECT
      DISTINCT bidder_id,
      'auction_extended',
      'Auction Extended',
      'Auction extended by 5 minutes due to late bid',
      p_auction_id
    FROM auction_bids
    WHERE auction_id = p_auction_id;
  END IF;

  -- Create outbid notifications for previous highest bidder
  IF v_previous_winner IS NOT NULL AND v_previous_winner != p_bidder_id THEN
    INSERT INTO notifications (user_id, type, title, message, reference_id)
    VALUES (
      v_previous_winner,
      'auction_outbid',
      'You have been outbid',
      'Someone placed a higher bid on auction: ' || v_auction.title,
      p_auction_id
    );
  END IF;

  -- Process auto-bids from other bidders
  -- (Complex logic for handling automatic bidding)

  RETURN jsonb_build_object(
    'success', true,
    'bid_id', v_new_bid_id,
    'new_highest_bid', p_bid_amount,
    'total_bids', v_auction.total_bids + 1
  );
END;
$$;
```

#### close_expired_auctions()
```sql
CREATE OR REPLACE FUNCTION close_expired_auctions()
RETURNS TABLE(processed_count INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_expired_auction RECORD;
  v_booking_id UUID;
  v_processed INTEGER := 0;
BEGIN
  -- Find and process expired auctions
  FOR v_expired_auction IN
    SELECT * FROM auctions
    WHERE status IN ('active', 'extended')
    AND ends_at <= NOW()
    FOR UPDATE
  LOOP
    -- Update auction status
    UPDATE auctions
    SET status = 'completed', updated_at = NOW()
    WHERE id = v_expired_auction.id;

    -- Create booking if there's a winner
    IF v_expired_auction.winner_id IS NOT NULL THEN
      INSERT INTO bookings (
        customer_id, handyman_id,
        service_title, service_description,
        booking_type, status,
        scheduled_start, estimated_duration,
        location, price_agreed,
        auction_id, created_at
      ) VALUES (
        v_expired_auction.winner_id,
        v_expired_auction.handyman_id,
        v_expired_auction.title,
        v_expired_auction.description,
        'auction',
        'confirmed',
        v_expired_auction.starts_at,
        v_expired_auction.estimated_duration,
        v_expired_auction.service_location,
        v_expired_auction.current_highest_bid,
        v_expired_auction.id,
        NOW()
      )
      RETURNING id INTO v_booking_id;

      -- Notify winner
      INSERT INTO notifications (user_id, type, title, message, reference_id)
      VALUES (
        v_expired_auction.winner_id,
        'auction_won',
        'Congratulations! You won the auction',
        'Your booking has been confirmed for ' || v_expired_auction.title,
        v_booking_id
      );

      -- Notify handyman
      INSERT INTO notifications (user_id, type, title, message, reference_id)
      VALUES (
        v_expired_auction.handyman_id,
        'auction_completed',
        'Your auction has ended',
        'Booking confirmed with winning bid of CHF ' || v_expired_auction.current_highest_bid,
        v_booking_id
      );
    END IF;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN QUERY SELECT v_processed;
END;
$$;
```

## Real-time Implementation

### Supabase Realtime Subscriptions

#### Auction Updates Channel
```typescript
interface AuctionRealtimeService {
  subscribeToAuction(auctionId: string, callbacks: AuctionCallbacks): void;
  subscribeToUserBids(userId: string, callbacks: BidCallbacks): void;
  unsubscribeFromAuction(auctionId: string): void;
  placeBid(auctionId: string, bidAmount: number, maxAutoBid?: number): Promise<BidResult>;
}

// Note: For production implementation, consider using the service pattern from
// docs/specs/development-guidelines.md with useAuctionService hook for better integration
class AuctionRealtimeService implements AuctionRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToAuction(auctionId: string, callbacks: AuctionCallbacks) {
    const channel = supabase
      .channel(`auction:${auctionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`
      }, (payload) => {
        callbacks.onAuctionUpdate(payload.new as AuctionDomain);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${auctionId}`
      }, (payload) => {
        callbacks.onNewBid(payload.new as AuctionBidDomain);
      })
      .subscribe();

    this.channels.set(auctionId, channel);
  }

  async placeBid(
    auctionId: string,
    bidAmount: number,
    maxAutoBid?: number
  ): Promise<BidResult> {
    const { data, error } = await supabase
      .rpc('place_auction_bid', {
        p_auction_id: auctionId,
        p_bidder_id: (await supabase.auth.getUser()).data.user?.id,
        p_bid_amount: bidAmount,
        p_max_auto_bid: maxAutoBid
      });

    if (error) {
      throw new Error(error.message);
    }

    // Map snake_case RPC response to camelCase domain model
    return {
      success: data.success,
      error: data.error,
      bidId: data.bid_id,
      newHighestBid: data.new_highest_bid
    };
  }
}
```

### Real-time Data Flow

1. **Auction Creation**
   - Handyman creates auction through mobile app
   - Auction inserted into database with 'scheduled' status
   - Real-time notification sent to relevant customers

2. **Auction Activation**
   - Scheduled job updates auction status to 'active' at start time
   - Real-time update broadcasts auction activation
   - Customers can now place bids

3. **Bid Placement**
   - Customer places bid through mobile app
   - `place_auction_bid()` function validates and processes bid
   - Database triggers real-time update to auction channel
   - All subscribed clients receive bid update
   - Outbid notifications sent to previous highest bidder

4. **Auto-extend Logic**
   - If bid placed in final 2 minutes and auto-extend enabled
   - Auction extended by 5 minutes
   - Extension notification sent to all bidders
   - Timer updates in all connected clients

5. **Auction Completion**
   - `close_expired_auctions()` function runs every minute
   - Winner determined and booking created
   - Winner and handyman notifications sent
   - Auction status updated to 'completed'

## Mobile App Components

### Auction Creation Flow (Handyman)

#### AuctionCreationForm Component
```typescript
interface AuctionCreationFormProps {
  onAuctionCreated: (auction: Auction) => void;
  initialData?: Partial<AuctionFormData>;
}

interface AuctionFormData {
  title: string;
  description: string;
  serviceCategory: ServiceCategory;
  startingPrice: number;
  reservePrice?: number;
  duration: AuctionDuration;
  scheduledStart: Date;
  autoExtend: boolean;
  location: ServiceLocation;
  estimatedDuration: number;
}

const AuctionCreationForm: React.FC<AuctionCreationFormProps> = ({
  onAuctionCreated,
  initialData
}) => {
  const [formData, setFormData] = useState<AuctionFormData>(initialData || defaultFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const validationResult = validateAuctionForm(formData);
      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        return;
      }

      const auction = await auctionService.createAuction(formData);
      onAuctionCreated(auction);
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ServiceDetailsSection
        data={formData}
        onChange={setFormData}
        errors={errors}
      />
      <PricingSection
        data={formData}
        onChange={setFormData}
        errors={errors}
      />
      <TimingSection
        data={formData}
        onChange={setFormData}
        errors={errors}
      />
      <LocationSection
        data={formData}
        onChange={setFormData}
        errors={errors}
      />
      <Button
        title="Create Auction"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
};
```

### Live Auction Interface (Customer)

#### AuctionBiddingCard Component

**Note**: This implementation assumes RPC responses are mapped from snake_case to camelCase in the service layer (as defined in the mapping strategy in `docs/specs/development-guidelines.md`). All component code uses consistent camelCase properties for improved type safety and consistency.

```typescript
interface AuctionBiddingCardProps {
  auction: Auction;
  onBidPlaced: (bid: AuctionBid) => void;
  currentUserBids: AuctionBid[];
}

const AuctionBiddingCard: React.FC<AuctionBiddingCardProps> = ({
  auction: initialAuction,
  onBidPlaced,
  currentUserBids
}) => {
  const [auction, setAuction] = useState(initialAuction);
  const [bidAmount, setBidAmount] = useState(auction.currentHighestBid + 5);
  const [maxAutoBid, setMaxAutoBid] = useState<number | undefined>();
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const auctionService = useAuctionService();
  const { user } = useAuth();

  // Computed values (declare early to use in effects)
  const isCurrentHighestBidder = auction.winnerId === user?.id;
  const minimumBid = (auction.currentHighestBid || auction.startingPrice) + 5;

  // Sync with prop changes
  useEffect(() => {
    setAuction(initialAuction);
  }, [initialAuction]);

  // Real-time subscription for auction updates
  useEffect(() => {
    const unsubscribe = auctionService.subscribeToAuction(auction.id, {
      onAuctionUpdate: (updatedAuction) => {
        // Update local state with real-time auction data
        setAuction(updatedAuction);
        if (updatedAuction.currentHighestBid) {
          setBidAmount(updatedAuction.currentHighestBid + 5);
        }
      },
      onNewBid: (bid) => {
        onBidPlaced(bid);
        // Show feedback if user was outbid
        if (bid.bidderId !== user?.id && isCurrentHighestBidder) {
          showOutbidNotification();
        }
      }
    });

    return unsubscribe;
  }, [auction.id, isCurrentHighestBidder]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0,
        new Date(auction.endsAt).getTime() - Date.now()
      );
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Auction ended
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.endsAt]);

  const handlePlaceBid = async () => {
    setIsPlacingBid(true);
    try {
      const result = await auctionService.placeBid(
        auction.id,
        bidAmount,
        maxAutoBid
      );

      if (result.success) {
        // Optimistic update
        onBidPlaced({
          id: result.bidId,
          auctionId: auction.id,
          bidderId: user!.id,
          bidAmount,
          bidTime: new Date().toISOString(),
          isAutoBid: false
        });

        // Show success feedback
        showSuccessNotification('Bid placed successfully!');

        // Reset form
        setBidAmount(result.newHighestBid + 5);
      }
    } catch (error) {
      showErrorNotification(error.message);
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <Card style={styles.auctionCard}>
      <AuctionHeader
        auction={auction}
        timeRemaining={timeRemaining}
      />

      <AuctionDetails auction={auction} />

      <CurrentBidDisplay
        currentHighestBid={auction.currentHighestBid}
        totalBids={auction.totalBids}
        isCurrentHighestBidder={isCurrentHighestBidder}
      />

      <BiddingControls
        bidAmount={bidAmount}
        setBidAmount={setBidAmount}
        maxAutoBid={maxAutoBid}
        setMaxAutoBid={setMaxAutoBid}
        minimumBid={minimumBid}
        onPlaceBid={handlePlaceBid}
        isPlacingBid={isPlacingBid}
        disabled={timeRemaining === 0 || isCurrentHighestBidder}
      />

      <RecentBidsDisplay
        auctionId={auction.id}
        limit={3}
      />
    </Card>
  );
};
```

## Notification System Integration

### Auction-Specific Notifications

#### Notification Types
```typescript
type AuctionNotificationType =
  | 'auction_outbid'           // User was outbid
  | 'auction_won'              // User won auction
  | 'auction_extended'         // Auction auto-extended
  | 'auction_ending_soon'      // 5 minutes remaining
  | 'auction_completed'        // Auction ended (to handyman)
  | 'auction_cancelled'        // Auction cancelled
  | 'bid_confirmation';        // Bid placed successfully

interface AuctionNotification {
  id: string;
  userId: string;
  type: AuctionNotificationType;
  title: string;
  message: string;
  auctionId: string;
  bidAmount?: number;
  isRead: boolean;
  createdAt: string;
}
```

#### Real-time Notification Delivery
```typescript
class AuctionNotificationService {
  async sendOutbidNotification(
    previousWinnerId: string,
    auction: Auction,
    newBidAmount: number
  ) {
    const notification: AuctionNotification = {
      userId: previousWinnerId,
      type: 'auction_outbid',
      title: 'You have been outbid',
      message: `Someone bid CHF ${newBidAmount} on "${auction.title}"`,
      auctionId: auction.id,
      bidAmount: newBidAmount
    };

    // Store in database
    await this.createNotification(notification);

    // Send push notification
    await this.sendPushNotification(previousWinnerId, {
      title: notification.title,
      body: notification.message,
      data: {
        type: 'auction_outbid',
        auctionId: auction.id
      }
    });

    // Send real-time update
    await this.sendRealtimeNotification(previousWinnerId, notification);
  }

  async sendAuctionWonNotification(winnerId: string, auction: Auction, booking: Booking) {
    const notification: AuctionNotification = {
      userId: winnerId,
      type: 'auction_won',
      title: 'Congratulations! You won the auction',
      message: `Your booking for "${auction.title}" has been confirmed`,
      auctionId: auction.id
    };

    await this.createNotification(notification);
    await this.sendPushNotification(winnerId, {
      title: notification.title,
      body: notification.message,
      data: {
        type: 'auction_won',
        auctionId: auction.id,
        bookingId: booking.id
      }
    });
  }
}
```

## Error Handling and Edge Cases

### Race Condition Prevention
- **Database Level**: Use `FOR UPDATE` locks in `place_auction_bid()` function
- **Optimistic Updates**: Show immediate feedback, reconcile with server response
- **Retry Logic**: Implement exponential backoff for failed bid attempts
- **Conflict Resolution**: Handle simultaneous bids with clear winner determination

### Network Interruption Handling
```typescript
class AuctionConnectionManager {
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;
  private reconnectionDelay = 1000;

  async handleConnectionLoss() {
    // Switch to polling mode
    this.startPollingMode();

    // Attempt to reconnect
    while (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      try {
        await this.reconnectRealtime();
        this.stopPollingMode();
        this.reconnectionAttempts = 0;
        break;
      } catch (error) {
        this.reconnectionAttempts++;
        await this.delay(this.reconnectionDelay * this.reconnectionAttempts);
      }
    }
  }

  private startPollingMode() {
    // Poll auction updates every 5 seconds as fallback
    this.pollingInterval = setInterval(async () => {
      try {
        const updatedAuction = await this.fetchAuctionUpdate();
        this.updateLocalAuctionState(updatedAuction);
      } catch (error) {
        console.error('Polling update failed:', error);
      }
    }, 5000);
  }
}
```

### Auction Validation and Security
- **Bid Validation**: Minimum increment, maximum limits, user authentication
- **Rate Limiting**: Prevent bid spam (maximum 1 bid per 2 seconds per user)
- **Suspicious Activity**: Monitor for bot activity and coordinated bidding
- **Financial Verification**: Ensure users can pay winning bid amounts

## Testing Strategy

### Unit Tests
```typescript
describe('AuctionService', () => {
  it('should place valid bid successfully', async () => {
    const mockAuction = createMockAuction();
    const bidAmount = mockAuction.currentHighestBid + 5;

    const result = await auctionService.placeBid(
      mockAuction.id,
      bidAmount
    );

    expect(result.success).toBe(true);
    expect(result.newHighestBid).toBe(bidAmount);
  });

  it('should reject bid below minimum increment', async () => {
    const mockAuction = createMockAuction();
    const bidAmount = mockAuction.currentHighestBid + 1; // Too low

    await expect(
      auctionService.placeBid(mockAuction.id, bidAmount)
    ).rejects.toThrow('Bid must be at least CHF');
  });
});
```

### Integration Tests
```typescript
describe('Real-time Auction Flow', () => {
  it('should handle concurrent bidding correctly', async () => {
    const auction = await createTestAuction();
    const bidders = await createTestBidders(5);

    // Simulate concurrent bidding
    const bidPromises = bidders.map((bidder, index) =>
      auctionService.placeBid(auction.id, 100 + (index * 5), bidder.id)
    );

    const results = await Promise.allSettled(bidPromises);
    const successfulBids = results.filter(r => r.status === 'fulfilled');

    // Only one bid should succeed due to race condition handling
    expect(successfulBids).toHaveLength(1);

    // Verify final auction state
    const finalAuction = await auctionService.getAuction(auction.id);
    expect(finalAuction.totalBids).toBe(1);
  });
});
```

## Performance Considerations

### Real-time Optimization
- **Connection Pooling**: Reuse Supabase connections across components
- **Subscription Management**: Automatic cleanup of unused subscriptions
- **Update Batching**: Batch multiple bid updates to prevent UI flickering
- **Memory Management**: Proper cleanup of timers and event listeners

### Database Performance
- **Indexing Strategy**: Optimize queries for auction listing and bid history
- **Connection Limits**: Monitor concurrent connections during peak bidding
- **Query Optimization**: Use efficient queries for real-time updates
- **Caching**: Cache auction metadata to reduce database load

### Swiss Market Compliance
- **Data Privacy**: GDPR compliance for EU users
- **Financial Regulations**: Swiss financial service regulations
- **Consumer Protection**: Clear terms and dispute resolution
- **Accessibility**: Swiss accessibility standards compliance

This specification provides a comprehensive guide for implementing the Worky auction system with proper real-time functionality, error handling, and Swiss market compliance.