# Worky – Build Specs (for Cascade)

## 1) Product Summary
- **Goal:** Spontaneous handyman booking. Handymen publish last-minute slots; customers book instantly. If multiple customers want the same slot, start an **auction**.
- **Platforms:** iOS/Android/Web (Expo).
- **Region:** Switzerland; currency **CHF**; tz **Europe/Zurich**.

## 2) MVP Scope (Phase 1)
- Auth (Supabase email/pass), role selection (handyman/customer).
- Handyman: profile (rate, region, work types), create/manage **time slots**.
- Customer: browse/filter by region/work type/time; book a slot.
- Realtime updates for slots and bookings.
- Basic notifications (local/placeholder; Supabase table present).

## 3) Screens (must map to existing routes)
- `app/(auth)/welcome.tsx`, `login.tsx`, `register.tsx`, `region-selection.tsx`, `work-type-selection.tsx`
- `app/(handyman)/dashboard.tsx`, `time-slots.tsx`, `slots.tsx`, `bookings.tsx`, `profile.tsx`
- `app/(customer)/dashboard.tsx`, `bookings.tsx`, `auctions.tsx`, `profile.tsx`
- Tabs in `app/(tabs)/*` and root layouts in `app/_layout.tsx` and folder `_layout.tsx` files

**Implementation notes**
- Use **ThemedText/ThemedView** and existing UI components (`components/*`).
- Follow examples in tests/services to keep API shape consistent (`lib/*-service.ts`). :contentReference[oaicite:3]{index=3}

## 4) Data Model (minimal working set)
- `users` (id, email, user_type)
- `handyman_profiles` (handyman_id, rate_chf, skills[], region, description)
- `time_slots` (id, handyman_id, work_type, region, start_ts, end_ts, price_chf, status=`open|booked|auction|canceled`)
- `bookings` (id, slot_id, customer_id, status=`pending|confirmed|canceled|completed`, final_price_chf)
- `auctions` (id, slot_id, status=`running|ended|canceled`, ends_at, start_price_chf, winning_bid_id)
- `auction_bids` (id, auction_id, customer_id, amount_chf, created_at)
- `notifications` (id, user_id, type, title, message, data jsonb, read)

**RLS baseline**
- Slots: public read `status='open'`; owner full; others no write.
- Bookings: owner (customer) + slot owner (handyman) can read; owner can cancel pre-start.
- Bids: insert by `auth.uid()`, read all; no updates after insert.
- New tables must ship with policies.

## 5) Flows & Acceptance Criteria
**Create Slot (handyman)**
- Validate end > start; duration ≤ 8h; non-overlap for the same handyman.
- On success: `status='open'`; visible immediately in customer browse.

**Book Slot (customer)**
- Only `open` slots bookable; creates booking `pending`; handyman can confirm.
- If second booking intent arrives before confirmation → start auction.

**Auction (Phase 2 preview)**
- `ends_at = now() + 10 min` (env-configurable).
- Realtime channel broadcasts current highest bid + countdown.
- On end: highest bid → winner; slot → `booked`; losers notified.

## 6) Services (client-side)
- `lib/auction-service.ts` — start/subscribe/place bid/close (uses Supabase Realtime & RPC).
- `lib/notification-service.ts` — create + subscribe to `notifications` changes.
- `lib/payment-service.ts` — **stub** for Stripe, return mocked objects until Phase 3.

## 7) Testing Targets
- Unit: services (auction, notifications, payment stubs).
- RTL: auth screens, slot form, booking button disabled/enabled states.
- Integration: “two users race to book” → auction trigger, time remaining logic.
- Reuse & extend existing tests under `__tests__/`. :contentReference[oaicite:4]{index=4}

## 8) DX & Commands
- Start: `npm start` (+ platform scripts).
- Lint: `npm run lint`
- Tests: `npm test` (coverage optional)
- SQL: keep migrations in `/database/*.sql`. Document changes in `/docs/SCHEMA.md`.

## 9) Non-Functional
- Accessibility (44px targets, labels), performance (memoize lists), themed UI for dark/light.
- Error messages should route through `components/ErrorMessage.tsx` patterns.

## 10) Out of Scope (MVP)
- Stripe payments, refunds (Phase 3)
- Complex messaging or offline sync
