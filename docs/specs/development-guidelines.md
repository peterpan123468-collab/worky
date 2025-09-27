# Worky Development Guidelines

This document establishes coding standards, best practices, and development conventions for the Worky Expo React Native project. All team members should follow these guidelines to ensure code consistency, maintainability, and quality.

## Project Structure and Organization

### File Structure Convention
```
src/
├── components/              # Reusable UI components
│   ├── auction/            # Auction-specific components
│   │   ├── AuctionCard.tsx
│   │   ├── BiddingInterface.tsx
│   │   └── AuctionTimer.tsx
│   ├── forms/              # Form components with validation
│   │   ├── LoginForm.tsx
│   │   ├── AuctionCreationForm.tsx
│   │   └── common/         # Shared form components
│   └── ui/                 # Basic UI elements
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Modal.tsx
├── services/               # Business logic and API calls
│   ├── auth.service.ts
│   ├── auction.service.ts
│   ├── notification.service.ts
│   └── supabase.ts
├── contexts/               # React contexts for global state
│   ├── AuthContext.tsx
│   ├── AuctionContext.tsx
│   └── ThemeContext.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useAuctions.ts
│   ├── useBidding.ts
│   └── useRealtime.ts
├── types/                  # TypeScript type definitions
│   ├── database.types.ts
│   ├── auction.types.ts
│   ├── user.types.ts
│   └── api.types.ts
├── utils/                  # Utility functions
│   ├── currency.ts         # CHF formatting utilities
│   ├── timezone.ts         # Swiss timezone handling
│   ├── validation.ts       # Input validation functions
│   └── constants.ts        # App constants
└── styles/                 # Styling configuration
    ├── theme.ts           # Color, typography, spacing
    ├── globalStyles.ts    # Global style definitions
    └── components/        # Component-specific styles
```

### Expo Router Structure
```
app/
├── (auth)/                 # Authentication flow
│   ├── _layout.tsx        # Auth-specific layout
│   ├── index.tsx          # Welcome/landing screen
│   ├── login.tsx          # Login screen
│   ├── register.tsx       # Registration screen
│   └── user-type.tsx      # User type selection
├── (handyman)/            # Handyman-specific screens
│   ├── _layout.tsx        # Handyman layout with tabs
│   ├── index.tsx          # Dashboard/home
│   ├── auctions/          # Auction management
│   │   ├── index.tsx      # Auction list
│   │   ├── create.tsx     # Create auction
│   │   └── [id].tsx       # Auction details
│   ├── bookings/          # Booking management
│   └── profile/           # Profile settings
├── (customer)/            # Customer-specific screens
│   ├── _layout.tsx        # Customer layout with tabs
│   ├── index.tsx          # Browse auctions
│   ├── auctions/          # Auction browsing and bidding
│   │   ├── index.tsx      # Active auctions
│   │   └── [id].tsx       # Auction detail and bidding
│   ├── bookings/          # My bookings
│   └── profile/           # Profile settings
└── _layout.tsx            # Root layout with auth routing
```

## TypeScript Configuration and Standards

### TypeScript Configuration
```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Type Definition Standards
```typescript
// Always use interfaces for object shapes
interface User {
  id: string;
  email: string;
  user_type: 'handyman' | 'customer';
  created_at: string;
  updated_at: string;
}

// Use type aliases for unions and computed types
type UserType = User['user_type'];
type AuctionStatus = 'scheduled' | 'active' | 'extended' | 'ended' | 'completed' | 'cancelled';

// Use const assertions for immutable values
const AUCTION_DURATIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
  { label: '24 hours', value: 1440 }
] as const;

type AuctionDuration = typeof AUCTION_DURATIONS[number]['value'];

// Use generic constraints for reusable types
interface ApiResponse<T> {
  data: T;
  error: string | null;
  success: boolean;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Database Type Generation
```typescript
// Generate types from Supabase schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          user_type: 'handyman' | 'customer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          user_type: 'handyman' | 'customer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'handyman' | 'customer';
          updated_at?: string;
        };
      };
      auctions: {
        Row: {
          id: string;
          handyman_id: string;
          title: string;
          description: string | null;
          starting_price: number;
          current_highest_bid: number | null;
          status: AuctionStatus;
          starts_at: string;
          ends_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          handyman_id: string;
          title: string;
          description?: string | null;
          starting_price: number;
          starts_at: string;
          ends_at: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          starting_price?: number;
          current_highest_bid?: number | null;
          status?: AuctionStatus;
          updated_at?: string;
        };
      };
    };
    Functions: {
      place_auction_bid: {
        Args: {
          p_auction_id: string;
          p_bidder_id: string;
          p_bid_amount: number;
          p_max_auto_bid?: number;
        };
        Returns: {
          success: boolean;
          error?: string;
          bid_id?: string;
          new_highest_bid?: number;
        };
      };
    };
  };
}

// Export convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Auction = Database['public']['Tables']['auctions']['Row'];
export type AuctionInsert = Database['public']['Tables']['auctions']['Insert'];
export type AuctionUpdate = Database['public']['Tables']['auctions']['Update'];
```

### Naming Convention Mapping Layer

To handle the mixed snake_case (database) and camelCase (UI) naming conventions, implement a consistent mapping layer:

#### Database to Domain Mapping
```typescript
// types/mappers.ts
export interface AuctionDomain {
  id: string;
  handymanId: string;
  title: string;
  description: string | null;
  startingPrice: number;
  currentHighestBid: number | null;
  status: AuctionStatus;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionBidDomain {
  id: string;
  auctionId: string;
  bidderId: string;
  bidAmount: number;
  previousHighestBid: number | null;
  isAutoBid: boolean;
  maxAutoBid: number | null;
  bidTime: Date;
}

// Mapping functions
export const toAuctionDomain = (row: Database['public']['Tables']['auctions']['Row']): AuctionDomain => ({
  id: row.id,
  handymanId: row.handyman_id,
  title: row.title,
  description: row.description,
  startingPrice: row.starting_price,
  currentHighestBid: row.current_highest_bid,
  status: row.status,
  startsAt: new Date(row.starts_at),
  endsAt: new Date(row.ends_at),
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export const toAuctionBidDomain = (row: Database['public']['Tables']['auction_bids']['Row']): AuctionBidDomain => ({
  id: row.id,
  auctionId: row.auction_id,
  bidderId: row.bidder_id,
  bidAmount: row.bid_amount,
  previousHighestBid: row.previous_highest_bid,
  isAutoBid: row.is_auto_bid,
  maxAutoBid: row.max_auto_bid,
  bidTime: new Date(row.bid_time)
});

export const fromAuctionDomain = (auction: Partial<AuctionDomain>): Database['public']['Tables']['auctions']['Insert'] => ({
  handyman_id: auction.handymanId!,
  title: auction.title!,
  description: auction.description,
  starting_price: auction.startingPrice!,
  starts_at: auction.startsAt!.toISOString(),
  ends_at: auction.endsAt!.toISOString()
});
```

#### Service Layer Integration
```typescript
// services/auction.service.ts (updated example)
export class AuctionService {
  async getAuctions(options: GetAuctionsOptions): Promise<PaginatedResponse<AuctionDomain>> {
    // ... database query logic ...

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch auctions: ${error.message}`);
    }

    return {
      data: (data || []).map(toAuctionDomain), // Convert to domain objects
      error: null,
      success: true,
      pagination: {
        page: options.page || 0,
        limit,
        total: count || 0,
        hasMore: (data?.length || 0) === limit
      }
    };
  }

  async placeBid(auctionId: string, bidAmount: number, maxAutoBid?: number): Promise<BidResult> {
    // ... authentication and RPC call ...

    return {
      success: data.success,
      error: data.error,
      bidId: data.bid_id, // Map snake_case response to camelCase
      newHighestBid: data.new_highest_bid
    };
  }
}
```

#### Component Usage
```typescript
// components/auction/AuctionBiddingCard.tsx
const AuctionBiddingCard: React.FC<AuctionBiddingCardProps> = ({
  auction, // Now receives AuctionDomain with camelCase properties
  onBidPlaced,
  currentUserBids
}) => {
  const [bidAmount, setBidAmount] = useState(auction.currentHighestBid + 5);

  // All component code uses consistent camelCase
  const minimumBid = (auction.currentHighestBid || auction.startingPrice) + 5;

  useEffect(() => {
    const unsubscribe = auctionService.subscribeToAuction(auction.id, {
      onAuctionUpdate: (updatedAuction: AuctionDomain) => {
        setAuction(updatedAuction); // Consistent camelCase interface
        if (updatedAuction.currentHighestBid) {
          setBidAmount(updatedAuction.currentHighestBid + 5);
        }
      },
      onNewBid: (bid: AuctionBidDomain) => {
        onBidPlaced(bid); // Consistent camelCase interface
      }
    });

    return unsubscribe;
  }, [auction.id]);
};
```

This mapping layer ensures:
- **Consistent Naming**: UI components always use camelCase
- **Type Safety**: TypeScript enforces correct property names
- **Clear Boundaries**: Database layer stays snake_case, domain layer uses camelCase
- **Easy Maintenance**: Changes to database schema only require mapper updates

## Component Development Standards

### Component Structure and Naming
```typescript
// Use PascalCase for component names
// Include proper TypeScript interfaces for props
// Use default exports for components

interface AuctionCardProps {
  auction: Auction;
  onBidPressed?: (auction: Auction) => void;
  showBidButton?: boolean;
  variant?: 'compact' | 'detailed';
  testID?: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  auction,
  onBidPressed,
  showBidButton = true,
  variant = 'detailed',
  testID = 'auction-card'
}) => {
  // Component logic here
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { user } = useAuth();

  // Early returns for conditional rendering
  if (!auction) {
    return <EmptyState message="Auction not found" />;
  }

  // Event handlers with clear names
  const handleBidPress = useCallback(() => {
    onBidPressed?.(auction);
  }, [auction, onBidPressed]);

  // Computed values
  const isOwner = user?.id === auction.handyman_id;
  const canBid = !isOwner && auction.status === 'active' && timeRemaining > 0;

  return (
    <Card style={styles.container} testID={testID}>
      <AuctionHeader auction={auction} variant={variant} />
      <AuctionDetails auction={auction} />
      {showBidButton && canBid && (
        <Button
          title={`Bid CHF ${auction.current_highest_bid + 5}`}
          onPress={handleBidPress}
          variant="primary"
          testID={`${testID}-bid-button`}
        />
      )}
    </Card>
  );
};

// StyleSheet definition
const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AuctionCard;
```

### Custom Hooks Pattern
```typescript
// Custom hooks should start with 'use' and encapsulate related logic
// Include proper error handling and loading states

interface UseAuctionsOptions {
  filters?: AuctionFilters;
  sortBy?: AuctionSortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  realtime?: boolean;
}

interface UseAuctionsReturn {
  auctions: Auction[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuctions = (options: UseAuctionsOptions = {}): UseAuctionsReturn => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const auctionService = useAuctionService();

  const loadAuctions = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const response = await auctionService.getAuctions({
        ...options,
        page: currentPage,
        limit: options.limit || 20
      });

      if (reset) {
        setAuctions(response.data);
      } else {
        setAuctions(prev => [...prev, ...response.data]);
      }

      setHasMore(response.pagination.hasMore);
      setPage(currentPage + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
    } finally {
      setLoading(false);
    }
  }, [auctionService, options, page]);

  const loadMore = useCallback(() => loadAuctions(false), [loadAuctions]);
  const refresh = useCallback(() => loadAuctions(true), [loadAuctions]);

  // Initial load
  useEffect(() => {
    loadAuctions(true);
  }, [options.filters, options.sortBy, options.sortOrder]);

  // Real-time subscription
  useEffect(() => {
    if (!options.realtime) return;

    const unsubscribe = auctionService.subscribeToAuctions({
      filters: options.filters,
      onAuctionCreated: (auction) => {
        setAuctions(prev => [auction, ...prev]);
      },
      onAuctionUpdated: (auction) => {
        setAuctions(prev =>
          prev.map(a => a.id === auction.id ? auction : a)
        );
      },
      onAuctionDeleted: (auctionId) => {
        setAuctions(prev => prev.filter(a => a.id !== auctionId));
      }
    });

    return unsubscribe;
  }, [auctionService, options.filters, options.realtime]);

  return {
    auctions,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};
```

## Supabase Integration Patterns

### Client Configuration
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time events
    }
  }
});

// Type-safe database client
export type SupabaseClient = typeof supabase;
```

### Service Layer Pattern
```typescript
// services/auction.service.ts
export class AuctionService {
  constructor(private supabase: SupabaseClient) {}

  async createAuction(auctionData: AuctionInsert): Promise<Auction> {
    const { data, error } = await this.supabase
      .from('auctions')
      .insert(auctionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create auction: ${error.message}`);
    }

    return data;
  }

  async getAuctions(options: GetAuctionsOptions): Promise<PaginatedResponse<Auction>> {
    let query = this.supabase
      .from('auctions')
      .select(`
        *,
        handyman_profiles(
          business_name,
          avatar_url,
          rating
        )
      `, { count: 'exact' });

    // Apply filters
    if (options.filters?.status) {
      query = query.eq('status', options.filters.status);
    }

    if (options.filters?.serviceCategory) {
      query = query.eq('service_category', options.filters.serviceCategory);
    }

    // Apply sorting
    query = query.order(options.sortBy || 'created_at', {
      ascending: options.sortOrder === 'asc'
    });

    // Apply pagination
    const limit = options.limit || 20;
    const offset = (options.page || 0) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch auctions: ${error.message}`);
    }

    return {
      data: data || [],
      error: null,
      success: true,
      pagination: {
        page: options.page || 0,
        limit,
        total: count || 0,
        hasMore: (data?.length || 0) === limit
      }
    };
  }

  async placeBid(
    auctionId: string,
    bidAmount: number,
    maxAutoBid?: number
  ): Promise<BidResult> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase.rpc('place_auction_bid', {
      p_auction_id: auctionId,
      p_bidder_id: user.id,
      p_bid_amount: bidAmount,
      p_max_auto_bid: maxAutoBid
    });

    if (error) {
      throw new Error(`Failed to place bid: ${error.message}`);
    }

    return data;
  }

  // Real-time subscription management
  subscribeToAuction(
    auctionId: string,
    callbacks: AuctionSubscriptionCallbacks
  ): () => void {
    const channel = this.supabase
      .channel(`auction:${auctionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`
      }, (payload) => {
        callbacks.onAuctionUpdate?.(payload.new as Auction);
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${auctionId}`
      }, (payload) => {
        callbacks.onNewBid?.(payload.new as AuctionBid);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}

// Service instance with dependency injection
export const createAuctionService = (supabase: SupabaseClient) => {
  return new AuctionService(supabase);
};
```

### RLS-Compliant Query Patterns
```typescript
// Always use authenticated queries for user-specific data
const getUserAuctions = async (): Promise<Auction[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // RLS policy automatically filters by user
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('handyman_id', user.id);

  if (error) throw error;
  return data;
};

// Use service role only for admin functions (backend only)
const adminCloseExpiredAuctions = async (): Promise<number> => {
  const { data, error } = await supabaseAdmin // Service role client
    .rpc('close_expired_auctions');

  if (error) throw error;
  return data.processed_count;
};
```

## Error Handling Patterns

### Centralized Error Handling
```typescript
// utils/error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuctionError extends AppError {
  constructor(message: string, code: string) {
    super(message, `AUCTION_${code}`, 400);
    this.name = 'AuctionError';
  }
}

// Error boundary component
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to Sentry or other error tracking
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
```

### Service Error Handling
```typescript
// services/base.service.ts
export abstract class BaseService {
  protected handleError(error: unknown, context: string): never {
    if (error instanceof PostgrestError) {
      if (error.code === 'PGRST116') {
        throw new ValidationError('Invalid request parameters');
      }
      throw new AppError(`Database error in ${context}: ${error.message}`, error.code);
    }

    if (error instanceof AuthError) {
      throw new AppError('Authentication required', 'AUTH_ERROR', 401);
    }

    if (error instanceof AppError) {
      throw error;
    }

    // Unknown error
    console.error(`Unexpected error in ${context}:`, error);
    throw new AppError('An unexpected error occurred', 'UNKNOWN_ERROR');
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i === maxRetries - 1) break;

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }

    throw lastError;
  }
}
```

## Real-time Subscription Management

### Connection Management
```typescript
// hooks/useRealtimeConnection.ts
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const subscriptions = useRef<Set<RealtimeChannel>>(new Set());

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    const handleConnecting = () => {
      setConnectionState('connecting');
    };

    supabase.realtime.on('connect', handleConnect);
    supabase.realtime.on('disconnect', handleDisconnect);
    supabase.realtime.on('connecting', handleConnecting);

    return () => {
      supabase.realtime.off('connect', handleConnect);
      supabase.realtime.off('disconnect', handleDisconnect);
      supabase.realtime.off('connecting', handleConnecting);
    };
  }, []);

  const subscribe = useCallback((channel: RealtimeChannel) => {
    subscriptions.current.add(channel);
    return () => {
      subscriptions.current.delete(channel);
      supabase.removeChannel(channel);
    };
  }, []);

  const cleanup = useCallback(() => {
    subscriptions.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptions.current.clear();
  }, []);

  return {
    isConnected,
    connectionState,
    subscribe,
    cleanup
  };
};
```

### Subscription Cleanup Pattern
```typescript
// Always cleanup subscriptions in components
const AuctionDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const { subscribe } = useRealtimeConnection();

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`auction:${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${id}`
      }, (payload) => {
        setAuction(payload.new as Auction);
      })
      .subscribe();

    const unsubscribe = subscribe(channel);

    // Cleanup on unmount
    return unsubscribe;
  }, [id, subscribe]);

  return (
    // Component JSX
  );
};
```

## Swiss Market Specific Utilities

### Currency Formatting
```typescript
// utils/currency.ts
import { Locale } from 'expo-localization';

export const formatCHF = (amount: number, locale?: Locale): string => {
  return new Intl.NumberFormat(locale || 'de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseCHF = (value: string): number => {
  // Remove CHF symbol and spaces, replace comma with dot
  const cleanValue = value
    .replace(/CHF/g, '')
    .replace(/\s/g, '')
    .replace(/'/g, '') // Swiss thousand separator
    .replace(',', '.');

  return parseFloat(cleanValue) || 0;
};

export const validateCHFAmount = (amount: number): boolean => {
  return amount >= 0 && Number.isFinite(amount) && amount <= 99999.99;
};
```

### Timezone Handling
```typescript
// utils/timezone.ts
import { format, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { de, fr, it } from 'date-fns/locale';

const SWISS_TIMEZONE = 'Europe/Zurich';

export const toSwissTime = (utcDate: Date): Date => {
  return utcToZonedTime(utcDate, SWISS_TIMEZONE);
};

export const toUTC = (swissDate: Date): Date => {
  return zonedTimeToUtc(swissDate, SWISS_TIMEZONE);
};

export const formatSwissDateTime = (
  date: Date,
  pattern: string = 'dd.MM.yyyy HH:mm',
  locale?: 'de' | 'fr' | 'it'
): string => {
  const swissDate = toSwissTime(date);
  const dateLocale = locale === 'fr' ? fr : locale === 'it' ? it : de;

  return format(swissDate, pattern, {
    timeZone: SWISS_TIMEZONE,
    locale: dateLocale
  });
};

export const isSwissBusinessHours = (date: Date): boolean => {
  const swissDate = toSwissTime(date);
  const hour = swissDate.getHours();
  const day = swissDate.getDay();

  // Monday to Friday, 8 AM to 6 PM
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
};

export const getNextBusinessDay = (date: Date): Date => {
  const swissDate = toSwissTime(date);
  let nextDay = new Date(swissDate);

  do {
    nextDay.setDate(nextDay.getDate() + 1);
  } while (nextDay.getDay() === 0 || nextDay.getDay() === 6); // Skip weekends

  return toUTC(nextDay);
};
```

## Testing Standards

### Component Testing with React Testing Library
```typescript
// __tests__/components/AuctionCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { createMockAuction } from '@/tests/mocks/auction.mock';

describe('AuctionCard', () => {
  const mockAuction = createMockAuction();
  const mockOnBidPressed = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders auction information correctly', () => {
    render(
      <AuctionCard
        auction={mockAuction}
        onBidPressed={mockOnBidPressed}
      />
    );

    expect(screen.getByText(mockAuction.title)).toBeOnTheScreen();
    expect(screen.getByText(`CHF ${mockAuction.starting_price}`)).toBeOnTheScreen();
  });

  it('calls onBidPressed when bid button is pressed', () => {
    render(
      <AuctionCard
        auction={mockAuction}
        onBidPressed={mockOnBidPressed}
      />
    );

    const bidButton = screen.getByTestId('auction-card-bid-button');
    fireEvent.press(bidButton);

    expect(mockOnBidPressed).toHaveBeenCalledWith(mockAuction);
  });

  it('does not show bid button when showBidButton is false', () => {
    render(
      <AuctionCard
        auction={mockAuction}
        showBidButton={false}
      />
    );

    expect(screen.queryByTestId('auction-card-bid-button')).not.toBeOnTheScreen();
  });
});
```

### Service Testing
```typescript
// __tests__/services/auction.service.test.ts
import { AuctionService } from '@/services/auction.service';
import { createMockSupabaseClient } from '@/tests/mocks/supabase.mock';

describe('AuctionService', () => {
  let auctionService: AuctionService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    auctionService = new AuctionService(mockSupabase);
  });

  describe('createAuction', () => {
    it('creates auction successfully', async () => {
      const mockAuctionData = {
        title: 'Test Auction',
        handyman_id: 'user-123',
        starting_price: 100,
        starts_at: '2024-01-01T10:00:00Z',
        ends_at: '2024-01-01T11:00:00Z'
      };

      const mockCreatedAuction = { id: 'auction-123', ...mockAuctionData };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedAuction,
              error: null
            })
          })
        })
      });

      const result = await auctionService.createAuction(mockAuctionData);

      expect(result).toEqual(mockCreatedAuction);
      expect(mockSupabase.from).toHaveBeenCalledWith('auctions');
    });

    it('throws error when creation fails', async () => {
      const mockAuctionData = {
        title: 'Test Auction',
        handyman_id: 'user-123',
        starting_price: 100,
        starts_at: '2024-01-01T10:00:00Z',
        ends_at: '2024-01-01T11:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(auctionService.createAuction(mockAuctionData))
        .rejects.toThrow('Failed to create auction: Database error');
    });
  });
});
```

## Performance Optimization Guidelines

### Memory Management
```typescript
// Always cleanup resources in useEffect
const useAuctionSubscription = (auctionId: string) => {
  const [auction, setAuction] = useState<Auction | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    let isActive = true;
    const controller = new AbortController();

    const fetchAuction = async () => {
      try {
        const data = await auctionService.getAuction(auctionId);
        if (isActive) {
          setAuction(data);
        }
      } catch (error) {
        if (isActive && !controller.signal.aborted) {
          console.error('Failed to fetch auction:', error);
        }
      }
    };

    fetchAuction();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [auctionId]);

  return auction;
};
```

### Image Optimization
```typescript
// components/ui/OptimizedImage.tsx
import { Image, ImageProps } from 'expo-image';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
  placeholder?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  placeholder = 'https://via.placeholder.com/300x200',
  ...props
}) => {
  return (
    <Image
      source={source}
      placeholder={placeholder}
      contentFit="cover"
      transition={200}
      cachePolicy="disk"
      {...props}
    />
  );
};
```

### List Performance
```typescript
// Use FlatList for large datasets with proper optimization
const AuctionList: React.FC<AuctionListProps> = ({ auctions, onBidPressed }) => {
  const renderAuction = useCallback(({ item }: { item: Auction }) => (
    <AuctionCard
      key={item.id}
      auction={item}
      onBidPressed={onBidPressed}
      variant="compact"
    />
  ), [onBidPressed]);

  const keyExtractor = useCallback((item: Auction) => item.id, []);

  return (
    <FlatList
      data={auctions}
      renderItem={renderAuction}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      getItemLayout={(data, index) => ({
        length: 200, // Approximate item height
        offset: 200 * index,
        index,
      })}
    />
  );
};
```

## Code Quality and Linting

### ESLint Configuration
```json
// .eslintrc.js
module.exports = {
  extends: [
    '@expo/eslint-config',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};
```

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:ci",
      "pre-push": "npm run type-check && npm run build"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

## Environment Management

### Environment Variables
```typescript
// config/env.ts
import Constants from 'expo-constants';

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NODE_ENV: 'development' | 'staging' | 'production';
  API_URL: string;
  SENTRY_DSN?: string;
}

const getEnvConfig = (): EnvConfig => {
  const env = Constants.expoConfig?.extra;

  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) {
    throw new Error('Missing required environment variables');
  }

  return {
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    NODE_ENV: env.NODE_ENV || 'development',
    API_URL: env.API_URL || env.SUPABASE_URL,
    SENTRY_DSN: env.SENTRY_DSN
  };
};

export const ENV = getEnvConfig();
```

This comprehensive development guideline ensures consistent, maintainable, and high-quality code across the Worky project while adhering to Swiss market requirements and React Native/Expo best practices.