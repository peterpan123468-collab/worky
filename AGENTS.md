# Repository Guidelines

## Project Structure & Module Organization
- Entry: `App.tsx`, `index.ts`. Source in `src/` (components, screens, navigation, contexts, services, hooks, utils, types).
- Assets: `assets/`. Config: `app.json`, `jest.config.js`, `.detoxrc.js`, `tailwind.config.js`, `tsconfig.json`.
- Tests: unit/integration in `src/**/__tests__` and `src/**/*.(test|spec).(ts|tsx)`; E2E in `e2e/`.
- Docs: `docs/` (plans, specs). DB: `database/` (schema, policies).

## Build, Test, and Development Commands
- Start: `npm start` (Expo). Platforms: `npm run ios` | `npm run android` | `npm run web`.
- Tests: `npm test`, watch `npm run test:watch`, unit `npm run test:unit`, integration `npm run test:integration`.
- E2E (Detox): build `npm run test:e2e:build`; run `npm run test:e2e:ios` or `npm run test:e2e:android`.
- Type check: `npm run type-check`. Coverage: `npx jest --coverage`.

## Coding Style & Naming Conventions
- TypeScript strict. 2‑space indent, single quotes, no semicolons. Keep imports tidy.
- Components: `PascalCase` (e.g., `AuctionCard.tsx`). Hooks: `useXxx.ts` in `src/hooks/`.
- DB mapping: snake_case from DB → camelCase in UI/types. Centralize business logic in `src/services/**`.
- Styling: NativeWind/Tailwind utilities; avoid ad‑hoc inline styles when possible.

## Swiss Market & Auction Rules (Claude Sync)
- Currency: CHF formatting throughout; min starting price CHF 20; bid increment CHF 5.
- Timezone: store UTC; display in `Europe/Zurich`; prefer business hours 08:00–18:00.
- Realtime: use Supabase Realtime for auctions with optimistic updates and safe cleanup; poll as fallback.
- Key RPCs: `place_auction_bid()`, `close_expired_auctions()`, `handle_new_user()`.

## Testing Guidelines
- Jest preset: `jest-expo`; libraries: `@testing-library/react-native`, `@testing-library/jest-native`.
- Focus: services, hooks, and critical UI; integration for auth/auctions; Detox flows for bidding and timers.

## Commit & Pull Request Guidelines
- Conventional Commits (`feat|fix|chore(scope): message`). Keep PRs focused; include description, linked issues, test notes, and UI screenshots/GIFs.

## Security & Configuration
- `.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Do not commit secrets; only expose values intended for clients.

## Agent Sync & Progress Tracking
- Follow CLAUDE.md context and specs under `docs/specs/**` to stay aligned.
- After significant changes, you MUST update:
  - Master plan: `docs/revised-implementation-plan.md` (mark done items, add scope changes, adjust timelines). The plan is the source of truth.
  - User flows: `docs/user-types-and-journeys.md` (explicitly document any flow/screen changes and rationale).
  - CLAUDE.md metadata (“Last Updated”, “Next Milestone”).
- Keep todos/plans in sync using the workspace’s planning tool; remove obsolete items and add new phase tasks.

## Claude Enforcement Rules (Mandatory)

1) Master Plan Is The Source Of Truth
- Any change to features, scope, or requirements must be reflected in `docs/revised-implementation-plan.md` in the same PR. If not updated, the prior plan remains authoritative.

2) User Flow Synchronization
- Any change to flows, screens, or roles must be reflected in `docs/user-types-and-journeys.md` with an explicit note of what changed and why.

3) Card UI Style Standard (Default For All Cards)
- All new cards must match existing styles; deviate only when explicitly requested.
- Use shared components from `src/components/ui/card.tsx`: `Card`, `CardHeader`, `CardContent`.
- Base (default): use Card defaults; prefer `borderRadius: 16` on containers for consistency.
- Glass theme: always merge `glassCard` from `src/components/themeStyles.ts`.
  - Import: `import { glassCard } from '../components/themeStyles'`
  - Example: `<Card style={[styles.card, theme === 'glass' && glassCard]}>`
  - Current `glassCard`: background `rgba(0,0,0,0.35)`, border `1`, borderColor `rgba(255,255,255,0.12)`.
- Text on glass: titles/headings `#ffffff`; subtitles/labels `rgba(255,255,255,0.7–0.85)`; values/body `#ffffff`.
- Status pill (glass): background `rgba(255,255,255,0.12)`, text `#e5e7eb`.
- Do not create ad‑hoc card containers when Card exists; use Card components and merge `glassCard` when `theme === 'glass'`.

4) Testing Requirements
- Every new business logic path must include tests (unit/integration as appropriate).
- Every new UI component must include an E2E test in `e2e/` covering the primary happy path.
- Updating flows/screens requires updating or adding corresponding E2E coverage.
