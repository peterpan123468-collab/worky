# Worky Project Context for Claude Code

This document provides comprehensive project context to ensure Claude Code stays grounded and maintains focus throughout the development process.

## Project Overview

**Worky** is a dual booking system mobile app built with Expo React Native and Supabase, designed for the Swiss market. The app connects handymen with customers through two booking mechanisms:

1. **Calendar Bookings**: Traditional advance booking through calendar integration
2. **Real-time Auctions**: Dynamic pricing system for premium time slots

## Core Business Model

### Two User Types

#### 1. Handyman (Service Provider)
- **Primary Role**: Create availability and auctions for services
- **Key Activities**:
  - Set calendar availability for advance bookings
  - Create real-time auctions for premium time slots
  - Manage earnings and service delivery
- **Revenue Model**: Earn through hourly rates (calendar) and auction winnings

#### 2. Customer (Service Consumer)
- **Primary Role**: Book services through calendar or auctions
- **Key Activities**:
  - Browse and book available time slots
  - Participate in real-time auction bidding
  - Rate and review service providers
- **Payment Model**: Pay agreed rates or winning auction bids

### Swiss Market Focus
- **Currency**: Swiss Francs (CHF) with proper formatting
- **Timezone**: Europe/Zurich for all scheduling
- **Business Hours**: 8:00-18:00 weekdays preferred
- **Languages**: German, French, Italian support planned
- **Regulations**: Swiss consumer protection and financial compliance

## Technical Architecture

### Technology Stack
- **Frontend**: Expo React Native with TypeScript
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Navigation**: expo-router with file-based routing
- **State Management**: React Context + custom hooks
- **Real-time**: Supabase Realtime for auction bidding

### Core Database Entities
```sql
-- User management
users                    # Auth with user_type (handyman/customer)
handyman_profiles        # Business info, rates, preferences
customer_profiles        # Booking history and preferences

-- Auction system (Primary Focus)
auctions                 # Real-time auction listings
auction_bids            # Bid tracking with race condition handling
bookings                # Both calendar and auction bookings

-- Supporting systems
time_slots              # Calendar availability
notifications           # Comprehensive notification system
```

### Key Database Functions
- `place_auction_bid()`: Handles real-time bidding with race condition protection
- `close_expired_auctions()`: Processes auction endings and creates bookings
- `handle_new_user()`: User registration with role-based setup

## Current Implementation Phase

### Active Development: Phase 3 - Core Auction System
**Duration**: 4-5 days (currently in progress)

**Critical Deliverables**:
1. **Auction Creation Flow** (Handyman)
   - Multi-parameter auction setup (starting price, duration, reserve price)
   - Time slot selection and conflict checking
   - Swiss timezone and CHF currency handling

2. **Real-time Bidding System** (Customer)
   - Supabase Realtime integration for live bid updates
   - `place_auction_bid()` function integration
   - Race condition handling and error management

3. **Auction Management**
   - Automatic auction closing and booking creation
   - Status tracking (scheduled → active → completed)
   - Winner determination and notification system

### Key Implementation Requirements

#### Real-time Architecture
- Use Supabase Realtime channels for auction updates
- Implement optimistic updates with server reconciliation
- Handle network interruptions with polling fallback
- Proper subscription cleanup and memory management

#### Swiss Market Compliance
- **Currency**: All prices in CHF with proper formatting (CHF 25.50)
- **Timezone**: Store UTC, display Europe/Zurich
- **Business Rules**: Minimum CHF 20 starting price, CHF 5 bid increments
- **Validation**: Swiss business hours and holiday restrictions

#### Type Safety and Code Organization
- **Database Mapping**: snake_case (database) → camelCase (UI components)
- **Service Layer**: Centralized business logic with error handling
- **Component Structure**: Reusable auction components with proper TypeScript interfaces

## Development Guidelines

### File Structure Convention
```
src/
├── components/auction/     # Auction-specific components
│   ├── AuctionCard.tsx
│   ├── BiddingInterface.tsx
│   └── AuctionTimer.tsx
├── services/              # Business logic and API calls
│   ├── auction.service.ts
│   └── supabase.ts
├── hooks/                 # Custom React hooks
│   ├── useAuctions.ts
│   └── useRealtime.ts
├── types/                 # TypeScript definitions
│   ├── database.types.ts
│   └── auction.types.ts
└── utils/                 # Swiss market utilities
    ├── currency.ts        # CHF formatting
    └── timezone.ts        # Europe/Zurich handling
```

### Code Quality Standards
- **TypeScript**: Strict mode with comprehensive type definitions
- **Error Handling**: Centralized error classes with proper user feedback
- **Testing**: Component tests, service tests, and integration tests
- **Performance**: Proper cleanup, memory management, and optimization

### Critical Success Factors
1. **Real-time Performance**: Auction bidding must handle concurrent users reliably
2. **Swiss Market Compliance**: CHF currency and timezone handling throughout
3. **Database Function Integration**: Proper usage of existing RPC functions
4. **Type Safety**: Consistent camelCase interface in UI components

## User Journeys Reference

### Handyman Journey (Auction Focus)
1. **Dashboard Access** → **View Calendar Status**
2. **Available Time Slots?** → **Create Auction for Available Time**
3. **Set Auction Parameters** → **Set Starting Bid & Duration**
4. **Publish Auction** → **Monitor Auction Bids**
5. **Auction Ends** → **Winner Selected** → **Complete Job** → **Earn Money**

### Customer Journey (Auction Focus)
1. **Dashboard Access** → **Browse Available Slots**
2. **Filter/Search Slots** → **Auction Slot** → **View Auction Details**
3. **Place Bid** → **Monitor Auction** → **Auction Won/Outbid**
4. **Job Completion** → **Rate Service**

## Current Development Priorities

### Immediate Tasks (Phase 3)
1. **Auction Creation Form** - Multi-step setup with validation
2. **Real-time Bidding Interface** - Live updates and bid placement
3. **Auction Timer Component** - Countdown with auto-extend logic
4. **Database Function Integration** - `place_auction_bid()` implementation

### Quality Gates
- **Functional**: All auction features work as specified
- **Performance**: Real-time features perform under load
- **Security**: RLS policies and auth flows properly implemented
- **Swiss Market**: Currency, timezone, and localization verified

## Risk Mitigation

### Technical Risks
- **Real-time Performance**: Implement fallback polling if Realtime fails
- **Race Conditions**: Rely on database function locks for bid consistency
- **Network Issues**: Optimistic updates with server reconciliation

### Business Risks
- **Currency Handling**: Comprehensive CHF formatting and validation
- **Timezone Issues**: Consistent UTC storage with Swiss display
- **User Experience**: Clear auction rules and bidding feedback

## Documentation References

### Core Documents
1. `/docs/user-types-and-journeys.md` - Complete user workflows and feature matrix
2. `/docs/implementation-phases.md` - 6-phase development roadmap
3. `/docs/specs/architecture-overview.md` - Technical architecture decisions
4. `/docs/specs/auction-system-spec.md` - Detailed auction implementation
5. `/docs/specs/development-guidelines.md` - Coding standards and patterns

### Database Schema
- Primary reference: `/database/schema.sql`
- All table structures, RLS policies, and database functions
- Snake_case naming convention (mapped to camelCase in UI)

## Success Metrics

### Phase 3 Completion Criteria
- [ ] Handymen can create auctions with all required parameters
- [ ] Real-time bidding works seamlessly across multiple clients
- [ ] Race conditions handled properly by database functions
- [ ] Auctions automatically close and create bookings for winners
- [ ] Swiss timezone and CHF currency properly handled throughout

### Code Quality Metrics
- [ ] TypeScript compilation passes without errors
- [ ] All components have proper test coverage
- [ ] Real-time subscriptions cleanup properly
- [ ] Error handling provides clear user feedback
- [ ] Performance optimized for mobile devices

---

**Last Updated**: Implementation Phase 3 - Core Auction System COMPLETED with Full Testing
**Next Milestone**: Phase 5 - Real-time Notifications & Advanced Features

This context document ensures Claude Code maintains focus on the auction system implementation while respecting Swiss market requirements and architectural decisions.

## 🎯 CRITICAL: Progress Tracking Requirements

**MANDATORY**: After EVERY significant change, implementation, or completion:

1. **Update Progress Tracking Document**:
   - File: `/docs/revised-implementation-plan.md`
   - Mark completed tasks with ✅
   - Update phase statuses (🚀 In Progress, ⏳ Planned, ✅ Complete)
   - Add completion dates in format: ✅ **COMPLETED** _(YYYY-MM-DD)_

2. **Update Todo List**:
   - Use TodoWrite tool to mark completed items
   - Keep todo list synchronized with implementation plan
   - Remove obsolete todos, add new phase tasks

3. **Update This File**:
   - Modify "Last Updated" section
   - Update "Next Milestone"
   - Add completed file listings to relevant sections

4. **Track Key Metrics**:
   - Files created/modified count
   - Test coverage completion
   - Phase completion percentage
   - Timeline adherence

**WHY**: This prevents scope drift, ensures accountability, maintains project focus, and provides clear progress visibility for stakeholders.

**WHEN TO UPDATE**:
- ✅ After completing any major component
- ✅ After finishing a phase or significant milestone
- ✅ After creating/modifying 5+ files
- ✅ After implementing any core feature
- ✅ After writing test suites
- ✅ Before starting new phases

**CURRENT STATUS**: Phase 3 COMPLETED with comprehensive testing - ready for Phase 5 kickoff.