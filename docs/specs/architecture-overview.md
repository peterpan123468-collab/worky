# Worky Architecture Overview

This document provides a comprehensive overview of the Worky mobile app architecture, consolidating the technical architecture decisions and providing guidance for the Expo + Supabase implementation.

## Technology Stack

### Frontend: React Native with Expo
- **Framework**: Expo SDK with TypeScript
- **Navigation**: expo-router for file-based routing
- **State Management**: React Context + React Query for server state
- **UI Components**: Custom components with consistent design system
- **Real-time**: Supabase Realtime subscriptions

### Backend: Supabase (BaaS)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with custom user types
- **Real-time**: Supabase Realtime for auction bidding
- **Functions**: PostgreSQL functions for business logic
- **Storage**: Supabase Storage for user avatars and service images

## Architecture Decision Records (ADRs)

### ADR-001: Supabase-only Backend
**Decision**: Use Supabase as the complete backend solution without custom server infrastructure.

**Implications**:
- All business logic implemented in PostgreSQL functions or client-side services
- Row Level Security (RLS) policies handle all data access control
- Real-time functionality via Supabase Realtime channels
- Reduced infrastructure complexity and maintenance overhead

**Implementation Impact**:
- Critical business logic (auction bidding) must be handled in database functions
- Client applications directly interact with Supabase APIs
- Security policies enforced at database level through RLS

### ADR-002: File-based Routing with expo-router
**Decision**: Use expo-router for navigation with file-based routing structure.

**Routing Structure**:
```
app/
├── (auth)/               # Authentication flow
│   ├── login.tsx
│   ├── register.tsx
│   └── user-type.tsx
├── (handyman)/           # Handyman-specific screens
│   ├── dashboard.tsx
│   ├── create-auction.tsx
│   └── auction-management.tsx
├── (customer)/           # Customer-specific screens
│   ├── browse-auctions.tsx
│   ├── bid-history.tsx
│   └── bookings.tsx
└── _layout.tsx           # Root layout with auth routing
```

### ADR-004: Real-time Auction Infrastructure
**Decision**: Implement real-time auction bidding using Supabase Realtime with PostgreSQL functions for race condition handling.

**Architecture Components**:
- **Client Subscriptions**: Real-time bid updates via Supabase channels
- **Server-side Logic**: `place_auction_bid()` function prevents race conditions
- **Automatic Processing**: `close_expired_auctions()` function handles auction endings
- **State Synchronization**: Optimistic updates with server reconciliation

### ADR-005: UTC Storage, Europe/Zurich Display
**Decision**: Store all timestamps as UTC in database, convert to Europe/Zurich timezone in UI.

**Implementation**:
- Database stores all datetime fields as `timestamptz` in UTC
- Client applications convert to local Swiss timezone for display
- Auction timers and scheduling respect Swiss business hours
- Date/time pickers work in local timezone but store as UTC

### ADR-006: Testing Strategy
**Decision**: Implement comprehensive testing strategy with React Testing Library, unit tests, and integration tests.

**Testing Layers**:
- **Unit Tests**: Services and utility functions
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Auction flows and real-time functionality
- **E2E Tests**: Critical user journeys with Detox

## Database Architecture

### Schema Overview
The database schema supports dual booking system with auction and calendar-based bookings:

```sql
-- Core user management
users                    # Auth with user_type (handyman/customer)
handyman_profiles        # Business info, rates, auction preferences
customer_profiles        # Preferences and booking history

-- Time and availability management
time_slots              # Calendar availability with booking_type integration
calendar_integrations   # External calendar sync (Google, Apple, Outlook)

-- Dual booking system
bookings                # Both calendar and auction bookings
auctions                # Real-time auction system
auction_bids            # Bid tracking with real-time updates

-- Communication and notifications
notifications           # Comprehensive notification system
messages               # In-app messaging system
```

### Row Level Security (RLS) Policies

All tables implement comprehensive RLS policies:

#### Users and Profiles
- **users**: Self-read/update only
- **handyman_profiles**: Public read for discovery, owner full control
- **customer_profiles**: Self-access only

#### Auctions and Bidding
- **auctions**: Public read for active auctions, handyman full control
- **auction_bids**: Participants can view, customers can insert only
- **bookings**: Participants can view their own bookings

#### Calendar and Availability
- **time_slots**: Public read for availability, handyman full control
- **calendar_integrations**: Handyman-only access

### Key Database Functions

#### `place_auction_bid(auction_id, bid_amount)`
Handles real-time bidding with race condition protection:
- Validates bid amount against current highest bid
- Ensures minimum increment (CHF 5)
- Updates auction status and notifies participants
- Returns success/failure with detailed error messages

#### `close_expired_auctions()`
Processes auction endings and creates bookings:
- Identifies expired auctions
- Determines winners based on highest valid bid
- Creates confirmed bookings for winners
- Triggers winner notifications
- Updates auction status to 'completed'

#### `handle_new_user()`
User registration with role-based setup:
- Creates appropriate profile record based on user_type
- Sets up default preferences and settings
- Initializes notification preferences
- Creates welcome notifications

## Real-time Architecture

### Supabase Realtime Integration

**Channel Structure**:
```typescript
// Auction-specific channels
const auctionChannel = supabase
  .channel(`auction:${auctionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'auction_bids',
    filter: `auction_id=eq.${auctionId}`
  }, handleBidUpdate)
  .subscribe()

// Global auction updates
const auctionsChannel = supabase
  .channel('auctions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'auctions'
  }, handleAuctionUpdate)
  .subscribe()
```

**Real-time Data Flow**:
1. User places bid through mobile app
2. `place_auction_bid()` function validates and processes bid
3. Database triggers real-time update to all auction subscribers
4. Connected clients receive bid update and refresh UI
5. Optimistic updates provide immediate feedback

### Connection Management
- **Auto-reconnection**: Handle network interruptions gracefully
- **Subscription Cleanup**: Proper channel cleanup on component unmount
- **Error Handling**: Fallback to polling if real-time connection fails
- **Rate Limiting**: Prevent excessive bid submissions

## Security Architecture

### Authentication Flow
```typescript
// User registration with type selection
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      user_type: 'handyman' | 'customer',
      full_name,
      phone
    }
  }
})

// Automatic profile creation via database trigger
// handle_new_user() creates appropriate profile record
```

### Data Access Patterns
All data access enforced through RLS policies:
- **Handyman Data**: Can read own auctions, bids, and bookings
- **Customer Data**: Can read active auctions, own bids, and bookings
- **Public Data**: Active auctions visible to all authenticated users
- **Admin Data**: System notifications and global settings

### API Security
- **Row Level Security**: All database queries filtered by user context
- **Service Key Protection**: Admin functions only via service key
- **Rate Limiting**: Prevent abuse of auction and bidding endpoints
- **Input Validation**: All user inputs validated at database level

## Mobile Architecture

### App Structure
```
src/
├── components/          # Reusable UI components
│   ├── auction/        # Auction-specific components
│   ├── forms/          # Form components with validation
│   └── ui/             # Basic UI elements (buttons, inputs)
├── services/           # Business logic and API calls
│   ├── auth.service.ts
│   ├── auction.service.ts
│   └── supabase.ts
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   ├── AuctionContext.tsx
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuctions.ts
│   ├── useBidding.ts
│   └── useRealtime.ts
├── types/              # TypeScript definitions
│   ├── database.types.ts
│   ├── auction.types.ts
│   └── user.types.ts
└── utils/              # Utility functions
    ├── currency.ts     # CHF formatting
    ├── timezone.ts     # Swiss timezone handling
    └── validation.ts   # Input validation
```

### State Management Strategy
- **Authentication State**: AuthContext with persistence
- **Server State**: React Query for caching and synchronization
- **Real-time State**: Custom hooks for Supabase Realtime
- **Local State**: React useState for component-specific state
- **Form State**: React Hook Form for complex forms

### Performance Optimizations
- **Lazy Loading**: Code splitting for different user types
- **Image Optimization**: Optimized images for service listings
- **Real-time Debouncing**: Prevent excessive real-time updates
- **Background Processing**: Handle auction closing in background
- **Memory Management**: Proper cleanup of subscriptions and timers

## Swiss Market Specific Requirements

### Currency and Localization
- **Currency**: CHF (Swiss Francs) with proper formatting (CHF 25.50)
- **Number Format**: Swiss locale (1'234.56)
- **Date Format**: DD.MM.YYYY format preference
- **Language**: German/French/Italian/Romansh support planned

### Timezone Handling
```typescript
// UTC storage, local display
import { format, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz'

const SWISS_TIMEZONE = 'Europe/Zurich'

// Store as UTC
const utcDate = zonedTimeToUtc(localDate, SWISS_TIMEZONE)

// Display as Swiss local time
const swissDate = utcToZonedTime(utcDate, SWISS_TIMEZONE)
const formattedDate = format(swissDate, 'dd.MM.yyyy HH:mm', {
  timeZone: SWISS_TIMEZONE
})
```

### Business Hours and Regulations
- **Auction Hours**: Respect Swiss business hours (8:00-18:00)
- **Weekend Restrictions**: Limited handyman availability on Sundays
- **Holiday Calendar**: Swiss national and cantonal holidays
- **Service Regulations**: Compliance with Swiss service industry regulations

## Integration Points

### Calendar Integration (Future)
- **Google Calendar**: OAuth integration for availability sync
- **Apple Calendar**: EventKit integration on iOS
- **Outlook**: Microsoft Graph API integration
- **Bi-directional Sync**: Booking confirmations appear in external calendars

### Payment Integration (Future)
- **Swiss Payment Methods**: PostFinance, Twint, Bank transfer
- **Stripe**: International credit/debit card processing
- **Invoice Generation**: Swiss-compliant invoice templates
- **Tax Handling**: Swiss VAT calculation and reporting

### Notification Services
- **Push Notifications**: Expo Push Notifications for mobile alerts
- **Email**: Supabase Edge Functions for email notifications
- **SMS**: Swiss SMS providers for critical auction updates
- **In-app**: Real-time notifications via Supabase Realtime

## Deployment Architecture

### Development Environment
- **Local Development**: Expo development server with Supabase local instance
- **Staging**: Expo development build with staging Supabase project
- **Production**: Expo Application Services (EAS) with production Supabase

### CI/CD Pipeline
1. **Code Commit**: GitHub repository with branch protection
2. **Automated Testing**: GitHub Actions running tests and linting
3. **Build Process**: EAS Build for iOS and Android
4. **Deployment**: EAS Submit to App Store and Google Play
5. **Database Migrations**: Supabase CLI for schema updates

### Monitoring and Analytics
- **Application Monitoring**: Sentry for error tracking
- **Performance Monitoring**: Expo Analytics for app performance
- **Business Analytics**: Custom analytics for auction metrics
- **Database Monitoring**: Supabase dashboard for query performance

This architecture provides a solid foundation for building the Worky dual booking system while maintaining scalability, security, and compliance with Swiss market requirements.