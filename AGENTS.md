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
- After significant changes: update `docs/revised-implementation-plan.md` checkboxes and phase statuses; adjust CLAUDE.md “Last Updated” and “Next Milestone”.
- Keep todos/plans in sync using the workspace’s planning tool; remove obsolete items and add new phase tasks.
