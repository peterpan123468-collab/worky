# Feature Completion Plan

**Last Updated**: 2025-01-16

## Objective
Close the gap between documented customer and handyman journeys and the current UI implementation by prioritising the missing booking, availability, notification, payment, and settings capabilities.

## Priority Matrix
| Priority | Theme | Key Outcomes |
|----------|-------|--------------|
| P0 (Immediate) | Customer & Handyman flow unblockers | Users can book, manage, and adjust availability directly from existing dashboards |
| P1 (High) | Scheduling, notifications, and insights | Calendar experiences, notification centre, extended analytics, and profile management ship with Swiss-compliant behaviour |
| P2 (Follow-up) | Monetisation & personalisation | Payment, reviews, settings, and expanded realtime coverage reach production readiness |

### P0 - Flow Unblockers (target: 3-4 days)
- **Customer booking interactions**
  - [x] Wire Book CTA in CustomerDashboard to booking creation (hand off to checkout placeholder until payments ready)
  - [x] Implement booking detail sheet: cancel/reschedule actions with Supabase mutations and toast feedback
  - [x] Activate My Bookings quick action and link to dedicated bookings screen (reuse BrowseAuctions list patterns)
  - [x] Deliver search filtering backed by Supabase queries (region, skill, availability window)
- **Handyman availability controls**
  - [x] Hook Set Availability to a modal/editor for CRUD on time_slots
  - [x] Implement quick status toggles (open slots, block off time) and make sure customer feeds update via context refresh
- **Shared real-time plumbing**
  - Extend realtime hooks beyond auctions to bookings and availability updates (fallback polling when socket drops)
- **QA & docs**
  - Unit tests for booking/availability services; component tests for dashboards
  - Detox scenario: customer books slot, handyman sees update
  - Update docs/user-types-and-journeys.md to reflect actionable booking/availability steps

### P1 - Scheduling, Notifications, and Insights (target: +4-5 days)
- **Calendar experiences**
  - Build shared calendar components (month/week view) with role-specific data overlays
  - Add View Calendar navigation for handymen and customer calendar snapshot in dashboard
- **Notification centre**
  - Complete NotificationCenter UI with read/unread management, filters, and deep links
  - Ensure background push handling & optimistic toast integration with ToastContext
- **Profile & analytics enhancements**
  - Surface handyman profile editor (rates, skills, regions) with validation and CHF formatting
  - Expand useAuctionAnalytics to include revenue trends, conversion funnels, and booking vs auction mix
- **QA & docs**
  - Add integration tests for notification service and analytics aggregations
  - Detox flow: user opens notification centre, marks alerts, navigates to linked item
  - Update API reference with profile, calendar, and notification endpoints; refresh troubleshooting guide with new failure modes
  - Produce updated system architecture diagram covering booking, availability, and notification flows

### P2 - Monetisation & Personalisation (target: +5-7 days)
- **Payment & transaction history**
  - Choose provider (Stripe Connect vs Twint) and implement client flows for checkout & payout summary placeholders
  - Add transaction ledger UI in both dashboards and ensure CHF rounding rules
- **Review & rating system**
  - Build review submission, display components, and moderation hooks; integrate ratings into discovery/search
- **User settings & preferences**
  - Introduce settings screen for notification opt-in, language preference, theme selection beyond light/dark
- **Realtime & resilience polish**
  - Audit realtime subscriptions; add health checks and backoff strategies for lifecycle, notifications, and reviews
- **QA & docs**
  - Contract tests for payment service, unit tests for review aggregation
  - Detox happy path: customer completes payment, leaves review, updates settings
  - Document flows in revised master plan, API reference, and deployment guide (payment env vars, provider setup)

## Cross-Cutting Requirements
- **Documentation cadence**: Every completed priority tier must update docs/revised-implementation-plan.md, docs/user-types-and-journeys.md, and CLAUDE.md (metadata, milestones).
- **Architecture artefacts**: Update docs/specs/architecture-overview.md with revised architecture diagram and flow annotations for each completed priority tier.
- **Testing baseline**: No feature ships without Jest coverage for services/hooks plus Detox coverage for primary flows.
- **Release sequencing**: Do not start P1 work until P0 acceptance criteria pass QA; payments (P2) require security review and updated Supabase policies before launch.
- **Dependencies & risks**:
  - Payment provider onboarding timelines could delay P2 - identify decision owner early.
  - Calendar implementation depends on finalising schema for recurring slots; confirm schema alignment before UI work.
  - Expanded realtime coverage may require Supabase quota review; monitor connection counts in staging.