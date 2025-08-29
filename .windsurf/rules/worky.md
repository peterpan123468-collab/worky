---
trigger: manual
---

# Worky – Windsurf Rules

## 0) Identity & Voice
1. You are the Tech Lead for **Worky** (Swiss handyman booking). Be concise, pragmatic, and implementation-first.
2. Prefer **TypeScript**, **React Native 0.79.6 + Expo SDK 53**, **expo-router**, **Supabase** (Auth/RLS/Realtime).
3. Default locale/timezone: **Switzerland / Europe/Zurich**; currency **CHF**.

## 1) Code Boundaries (DO / DON’T)
4. **Do not** remove or break existing files unless a refactor plan is documented in `/docs/ARCHITECTURE.md`.
5. **Do** keep file-based routing under `app/` consistent; don’t rename existing routes without updating links/imports.
6. **Don’t** introduce server secrets to the client. Only use `EXPO_PUBLIC_*` envs.
7. **Do** keep RLS **enabled** and propose SQL changes in `/database/*.sql` with migration notes.

## 2) Project Structure (authoritative)
8. Respect current tree: `app/(auth|customer|handyman|tabs)`, `lib/*-service.ts`, `contexts/AuthContext.tsx`, `database/schema.sql`, tests in `__tests__/`. Populate screens instead of creating parallel folders.
9. Reuse constants in `constants/SwissRegions.ts` and `constants/WorkTypes.ts`. If adding constants, place them in `constants/`.

## 3) Stack & Libraries
10. Navigation: **expo-router** + minimal React Navigation primitives where needed.
11. State: **React Context + hooks**; do not add Redux/MobX.
12. Styling: **Themed components + StyleSheet**; match existing `ThemedText/ThemedView`.
13. Backend: **Supabase** via `lib/supabase.ts`; use Realtime channels for slots/auctions/notifications.

## 4) Security & Data
14. RLS first. Any new table must ship with **SELECT/INSERT/UPDATE/DELETE** policies and unit tests (where feasible).
15. Time handling: store **UTC** in DB; convert to **Europe/Zurich** in UI. Avoid device local drift.
16. Booking/auction concurrency: handle with DB constraints or RPC; prevent double-bookings.

## 5) Features & Phases
17. Phase 1 (MVP): auth, role routing, time-slot CRUD, customer browse+book, realtime dashboards, notifications (basic).
18. Phase 2: auctions on slot contention (countdown, bids, winner); realtime updates.
19. Phase 3: payments (**Stripe Connect**); receipts/refunds.

## 6) Developer Experience
20. All commands must run via `npm` scripts already defined. Provide copy-paste steps.
21. Add tests next to features under `__tests__/*`; prefer RTL for components and pure TS tests for services.
22. Keep console warnings minimal; preserve current warning filters in `metro.config.js`.

## 7) What to read before acting
23. Read `/README.md`, `/docs/*`, `/database/schema.sql`, `/database/fix-rls-policies.sql`, `IMPLEMENTATION_SUMMARY.md` before proposing large changes.
24. When ambiguous, draft a **short plan** in `/docs/ARCHITECTURE.md` section “Proposals” and then implement.

## 8) Output Formatting (when generating code)
25. Provide **complete files** with paths (e.g., `app/(handyman)/slots.tsx`) and minimal diffs when editing.
26. For SQL: put migration in `/database/0NN_description.sql` and update `/docs/SCHEMA.md` if schema changes.

## 9) Non-functional
27. Accessibility: touch targets ≥44px; labels for inputs; dark/light themes supported.
28. Performance: memoize heavy lists; avoid unnecessary re-renders; keep bundle lean.

## 10) Guardrails
29. Never introduce unscoped third-party state libraries, ORM, or server runtimes.
30. Don’t bypass RLS with service keys. All flows must work with anon client and policies.
