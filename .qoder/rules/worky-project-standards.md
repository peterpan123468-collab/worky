# Worky v2 Project Standards (Always Apply)

## Project Overview
Worky v2 is a Swiss marketplace mobile app connecting handymen with customers. Built with React Native/Expo, TypeScript, and Supabase backend.

## Directory Structure (MANDATORY)
- **Source**: All code in `src/` directory
- **Components**: `src/components/` (PascalCase naming)
- **Screens**: `src/screens/` 
- **Services**: `src/services/` (business logic)
- **Hooks**: `src/hooks/` (useXxx.ts naming)
- **Types**: `src/types/` (TypeScript definitions)
- **Tests**: `src/**/__tests__` or `src/**/*.(test|spec).(ts|tsx)`

## Coding Standards (STRICTLY ENFORCED)
- **TypeScript**: Strict mode, no `any` types
- **Style**: 2-space indent, single quotes, no semicolons
- **Naming**: 
  - Components: `PascalCase` (e.g., `AuctionCard.tsx`)
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Database fields: `snake_case` → convert to `camelCase` in UI

## Swiss Market Rules (BUSINESS CRITICAL)
- **Currency**: Always format as CHF (Swiss Francs)
- **Minimum Bid**: CHF 20
- **Bid Increments**: CHF 5
- **Timezone**: Store UTC, display Europe/Zurich
- **Business Hours**: 08:00–18:00 preferred

## UI Component Standards
### Card Components (DEFAULT)
```typescript
// Required import for all cards
import { Card, CardHeader, CardContent } from '../components/ui/card'
import { glassCard } from '../components/themeStyles'

// Standard usage
<Card style={[styles.card, theme === 'glass' && glassCard]}>
  <CardHeader>Title</CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Glass Theme Colors
- **Background**: `rgba(0,0,0,0.35)`
- **Border**: `1px solid rgba(255,255,255,0.12)`
- **Text**: Titles `#ffffff`, Subtitles `rgba(255,255,255,0.7–0.85)`
- **Border Radius**: 16px for consistency

## Testing Requirements (NON-NEGOTIABLE)
- **Framework**: Jest with `jest-expo` preset
- **Libraries**: `@testing-library/react-native`
- **Coverage**: All new business logic must include tests
- **E2E**: Primary user flows must have Detox tests

## Real-time Features
- **Primary**: Supabase Realtime with optimistic updates
- **Fallback**: Polling mechanism
- **Key Functions**: `place_auction_bid()`, `close_expired_auctions()`, `handle_new_user()`

## Security Standards
- **Environment**: Use `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **RLS**: Row-Level Security policies required
- **Authentication**: Supabase Auth integration
- **Secrets**: Never commit to version control

## Documentation Rules (CRITICAL)
- **Master Plan**: Update `docs/revised-implementation-plan.md` for ANY scope changes
- **User Flows**: Update `docs/user-types-and-journeys.md` for flow/screen changes
- **Rationale**: Document what changed and why

## Git Standards
- **Commits**: Use conventional commits (`feat|fix|chore(scope): message`)
- **PRs**: Include description, tests, and UI screenshots
- **Branch**: Currently on `feature/phase5a-start`

## Development Commands
```bash
npm start                 # Start Expo dev server
npx expo start --clear   # Clear cache restart
npm test                 # Run tests
npm run test:watch      # Watch mode
npm run type-check      # TypeScript check
```

## Error Prevention
- **No ad-hoc card containers**: Always use Card components
- **No inline styles**: Use NativeWind/Tailwind utilities
- **No hardcoded currencies**: Use CHF formatting functions
- **No UTC display**: Always convert to Europe/Zurich for users

## File Organization
- Keep imports organized and tidy
- Centralize business logic in services
- Use feature-based directory structure
- Place tests adjacent to source files