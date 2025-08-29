# Worky – Requirements & Design Decisions

## 1) Business Requirements
- **Core value**: last-minute handyman availability with instant booking.
- **Geography**: Switzerland; language expansion later.
- **Users**: Handyman, Customer.
- **MVP outcomes**:
  - Handyman can publish time slots and manage bookings.
  - Customer can discover, filter, and book a slot immediately.
  - Realtime updates reflect availability and booking status instantly.

## 2) Functional Requirements
- **Auth**: Supabase email/password, role captured at sign up; role-based routing.
- **Handyman**:
  - Create slot (work type, region, start, end, price or rate).
  - View/manage own slots and bookings; confirm/decline; mark completed.
- **Customer**:
  - Browse "open" slots by region/work type/date.
  - Book a slot; view/cancel before start.
- **Auction (Phase 2)**:
  - Trigger when contention detected; 10-minute default countdown.
  - Realtime bids; winner auto-selected on expiry.
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

**ADR-003: Auctions via DB + Realtime**
- *Decision*: Represent auctions and bids in Postgres; use Realtime channels; a `close_auction` RPC finalizes winners.
- *Why*: Ensures single source of truth and resolves race conditions server-side.
- *Implications*: Add indexes, constraints, and scheduled close logic.

**ADR-004: UTC storage, Europe/Zurich display**
- *Decision*: All timestamps UTC in DB; convert in UI.
- *Why*: Predictable calculations across platforms.
- *Implications*: Utilities for tz conversion; tests for daylight-saving edges.

**ADR-005: Testing strategy**
- *Decision*: RTL for UI smoke tests; unit tests for services; integration tests for auction/payment flows.
- *Why*: Fast feedback; confidence in concurrency and realtime.
- *Implications*: Keep mocks for Supabase/Stripe; CI-friendly suites.

## 5) Data Constraints
- Slots: end > start; duration ≤ 8h; non-overlap per handyman.
- Booking status flow: `pending → confirmed → completed` (or `canceled`).
- Slot status: `open|booked|auction|canceled`.
- Auction: `ends_at = now() + N minutes`; min bid increment (e.g., CHF 5).

## 6) RLS Overview (must exist on every table)
- **profiles/users**: self-read, self-update.
- **time_slots**: public read when `open`; owner full write.
- **bookings**: visible to booking owner and slot owner; self update/cancel pre-start.
- **auctions/bids**: read all; bids insert by self; no bid updates after insert.
- **notifications**: user can read own; system inserts.

## 7) Open Questions / Future Decisions
- Payment hold vs. post-auction charge (Phase 3).
- Dispute & refund policies; cancellation windows.
- Push provider final choice (Expo vs. server relay).
