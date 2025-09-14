# Worky – Requirements & Design Decisions

## 1) Business Requirements
- **Core value**: Dual booking system with calendar integration and auction-based premium services.
- **Geography**: Switzerland; language expansion later.
- **Users**: Handyman, Customer.
- **MVP outcomes**:
  - Handyman can set calendar availability and create premium auctions.
  - Customer can book via calendar directly or participate in real-time auctions.
  - Auction system allows revenue optimization for high-demand time slots.
  - Realtime updates for auction bidding and calendar booking status.

## 2) Functional Requirements
- **Auth**: Supabase email/password, role captured at sign up; role-based routing.
- **Handyman**:
  - Set calendar availability for direct customer booking.
  - Create auctions for premium time slots with customizable parameters.
  - Set starting price, duration (15 minutes to 24 hours), and reserve price.
  - Monitor real-time auction bids and calendar bookings.
  - Confirm calendar bookings; auction wins are auto-confirmed.
- **Customer**:
  - Book directly through handyman's integrated calendar system.
  - Browse and participate in active auctions created by handymen.
  - Place competitive bids with real-time updates and outbid notifications.
  - Monitor auction countdown timers and bidding activity.
  - Set maximum bid limits for budget management.
- **Auction System (Current Phase)**:
  - Real-time bidding with Supabase Realtime channels.
  - Customizable auction duration and automatic winner selection.
  - Binding bid commitments with reserve price requirements.
- **Payments (Phase 3)**:
  - Stripe Connect for payouts; refund flow on cancellation policy.

## 3) Non-Functional Requirements
- **Security**: RLS everywhere; least privilege; no service keys in client.
- **Performance**: responsive lists; minimal over-fetch; realtime filters per region/type.
- **Reliability**: prevent double bookings; handle offline grace with clear errors.
- **UX**: consistent theming; a11y targets; clear error copy.

## 4) Architecture Decisions (ADRs)
**ADR-001: Client-only + Supabase backend**
- *Decision*: Use Supabase (Auth/DB/Realtime) + Expo app; no custom server for MVP.
- *Why*: Speed, cost, RLS-protected access, Realtime push.
- *Implications*: Business logic either in SQL (policies/functions) or thin client services.

**ADR-002: File-based routing with `expo-router`**
- *Decision*: Keep routes under `app/…` matching layout and tabs.
- *Why*: Simpler navigation model; aligns with current codebase.
- *Implications*: New screens must follow the folder conventions.

**ADR-003: Dual Booking System with Auction Priority**
- *Decision*: Separate calendar booking from auction system; handymen create auctions independently for premium time slots.
- *Why*: Allows revenue optimization through auction-based pricing while maintaining direct booking simplicity.
- *Implications*: Calendar integration separate from auction functionality; auction creation is handyman-driven.

**ADR-004: Real-time Auction Infrastructure**
- *Decision*: Use Supabase Realtime channels for live auction bidding; Postgres functions for automatic winner selection.
- *Why*: Ensures real-time bidding experience and resolves race conditions server-side.
- *Implications*: Comprehensive notification system for outbids and auction status updates.

**ADR-005: UTC storage, Europe/Zurich display**
- *Decision*: All timestamps UTC in DB; convert in UI.
- *Why*: Predictable calculations across platforms.
- *Implications*: Utilities for tz conversion; tests for daylight-saving edges.

**ADR-006: Testing strategy**
- *Decision*: RTL for UI smoke tests; unit tests for services; integration tests for auction/payment flows.
- *Why*: Fast feedback; confidence in concurrency and realtime.
- *Implications*: Keep mocks for Supabase/Stripe; CI-friendly suites; specific auction race condition testing.

## 5) Data Constraints
- Calendar slots: end > start; duration ≤ 8h; non-overlap per handyman.
- Booking status flow: `pending → confirmed → completed` (or `canceled`).
- Calendar booking: direct confirmation required by handyman.
- Auction booking: automatic confirmation for winning bidder.
- Auction constraints: `ends_at = now() + N minutes`; min bid increment (CHF 5).
- Auction parameters: starting price, reserve price (optional), duration (15 min - 24h).
- Bid requirements: must exceed current highest by minimum increment.

## 6) RLS Overview (must exist on every table)
- **profiles/users**: self-read, self-update.
- **time_slots**: calendar integration context; handyman full control.
- **bookings**: visible to booking owner and service provider; calendar vs auction booking types.
- **auctions**: public read for active auctions; handyman can create/manage own.
- **auction_bids**: read all participants; bids insert by self; no bid updates after insert.
- **notifications**: user can read own; system inserts for auction and booking events.

## 7) Open Questions / Future Decisions
- Payment hold vs. post-auction charge (Phase 3).
- Auction reserve price not met - slot availability handling.
- Calendar booking conflicts with auction creation timing.
- Dispute & refund policies; cancellation windows.
- Push provider final choice (Expo vs. server relay).
- Proxy bidding implementation for Phase 3.

## Cross-References
- UI spec for Expo dark design: `docs/specs/SPEC-UI-MOBILE-001.md`
- Build checklist for mobile app repo: `docs/expo-build-checklist.md`

## Progress

- [x] Phase 1: Project Foundation & Expo Setup
- [x] Phase 2: Database Integration & Auth Foundation (Supabase + RLS)
- [ ] Phase 3: Core Auction System
  - [x] Types, service layer, realtime hooks
  - [x] Create Auction form (CHF rules, duration, reserve, auto‑extend)
  - [x] Browse Auctions with filters (service, region)
  - [x] Auction Detail with timer, realtime bids, outbid toast, ended summary
  - [x] Dashboard wiring (Create, Browse, embedded active lists)
  - [ ] Calendar conflict checks and slot selection
  - [ ] Deeper validations, polish and tests
- [ ] Phase 5: Notifications & Auction Management
- [ ] Phase 6: Documentation & Architecture Specs
