# Worky Troubleshooting Guide

This document provides solutions for common issues encountered during development, testing, and production use of the Worky mobile app.

## Table of Contents
1. [Development Issues](#development-issues)
2. [Authentication Problems](#authentication-problems)
3. [Database Issues](#database-issues)
4. [Real-time Problems](#real-time-problems)
5. [Auction System Issues](#auction-system-issues)
6. [Notification Problems](#notification-problems)
7. [Deployment Issues](#deployment-issues)
8. [Performance Problems](#performance-problems)

## Development Issues

### Environment Setup Problems

#### Node.js Version Issues
**Problem:** Compatibility issues with Node.js versions
**Solution:**
```bash
# Check Node.js version
node --version

# Use LTS version (18.x or 20.x)
nvm install --lts
nvm use --lts
```

#### Dependency Installation Failures
**Problem:** `npm install` fails with various errors
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If issues persist, try with yarn
yarn install
```

### Expo Development Server Issues

#### Port Already in Use
**Problem:** Expo server fails to start due to port conflicts
**Solution:**
```bash
# Kill processes using port 19000-19006
npx kill-port 19000
npx kill-port 19001
npx kill-port 19002

# Or kill all Node.js processes (Windows)
taskkill /f /im node.exe

# Restart Expo
npx expo start
```

#### Metro Bundler Crashes
**Problem:** Metro bundler crashes during development
**Solution:**
```bash
# Clear Metro cache
npx expo start --clear

# Reset cache explicitly
npm start -- --reset-cache

# Check for circular dependencies
npx madge --circular src/
```

### TypeScript Compilation Errors

#### Type Definition Conflicts
**Problem:** Type errors after Supabase schema changes
**Solution:**
```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id "your-project-id" > src/types/database.types.ts

# Restart TypeScript server
# In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

## Authentication Problems

### Login Failures

#### Invalid Credentials
**Problem:** Users cannot log in with correct credentials
**Solution:**
```bash
# Check Supabase Auth configuration
# Verify email confirmation settings
# Check for typos in environment variables

# Test connection
npm run test:auth-connection
```

#### Session Expiration
**Problem:** Users are logged out frequently
**Solution:**
```typescript
// Implement proper session refresh
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      // Update auth context
      setSession(session);
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

### Registration Issues

#### Profile Creation Failures
**Problem:** User profiles not created after registration
**Solution:**
```sql
-- Check if handle_new_user trigger exists
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually test trigger
SELECT handle_new_user();
```

## Database Issues

### Connection Problems

#### Database Unreachable
**Problem:** Application cannot connect to Supabase database
**Solution:**
```bash
# Test database connection
npm run test:db-connection

# Check environment variables
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Verify network connectivity
ping db.supabase.co
```

#### RLS Policy Violations
**Problem:** Permission denied errors when accessing data
**Solution:**
```sql
-- Check current user
SELECT auth.uid();

-- Verify RLS policies
SELECT * FROM pg_policy WHERE polrelid = 'auctions'::regclass;

-- Test policy manually
SET SESSION AUTHORIZATION 'authenticated';
SELECT * FROM auctions LIMIT 1;
```

### Data Integrity Issues

#### Missing Columns
**Problem:** Schema mismatch errors when inserting data
**Solution:**
```sql
-- Refresh schema cache
REFRESH MATERIALIZED VIEW information_schema.columns;

-- Check table structure
\d+ table_name

-- Update local schema
-- Run database/schema.sql again
```

## Real-time Problems

### Subscription Failures

#### Connection Drops
**Problem:** Real-time subscriptions disconnect frequently
**Solution:**
```typescript
// Implement reconnection logic
const channel = supabase
  .channel('auctions')
  .on(/* ... */)
  .subscribe(async (status) => {
    if (status === 'CHANNEL_ERROR') {
      console.log('Reconnecting...');
      await supabase.removeChannel(channel);
      // Reinitialize subscription
    }
  });
```

#### Missed Updates
**Problem:** Real-time updates not received by clients
**Solution:**
```typescript
// Verify channel subscription
console.log(channel.state); // Should be 'SUBSCRIBED'

// Check for proper cleanup
useEffect(() => {
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Auction System Issues

### Bidding Problems

#### Race Conditions
**Problem:** Multiple users placing bids simultaneously
**Solution:**
```sql
-- Verify place_auction_bid function uses row locking
SELECT pg_get_functiondef('place_auction_bid'::regproc);

-- Test with concurrent bids
-- Use database function, not direct table updates
```

#### Invalid Bid Amounts
**Problem:** Bids below minimum increment accepted
**Solution:**
```typescript
// Validate on client side
if (bidAmount < minimumBid) {
  throw new Error(`Bid must be at least CHF ${minimumBid}`);
}

// But always rely on server validation
```

### Auction Timing Issues

#### Expired Auctions Not Closing
**Problem:** Auctions remain active after end time
**Solution:**
```bash
# Manually trigger auction closing
supabase.rpc('close_expired_auctions');

# Set up cron job for automatic processing
# In Supabase dashboard: Database → Cron Jobs
```

## Notification Problems

### Push Notification Failures

#### Notifications Not Delivered
**Problem:** Users don't receive push notifications
**Solution:**
```sql
-- Check notification records
SELECT * FROM notifications 
WHERE user_id = 'user-id' 
AND read_at IS NULL 
ORDER BY created_at DESC;

-- Verify notification service
SELECT notificationService.sendTestNotification('user-id');
```

#### Notification Preferences
**Problem:** Users receive unwanted notifications
**Solution:**
```typescript
// Implement notification preferences
const updatePreferences = async (userId, preferences) => {
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      notification_preferences: preferences
    });
};
```

## Deployment Issues

### Build Failures

#### iOS Build Errors
**Problem:** iOS build fails during Expo build process
**Solution:**
```bash
# Check provisioning profiles
expo credentials:manager

# Update Expo CLI
npm install -g @expo/cli

# Clear build cache
expo build:ios --clear-cache
```

#### Android Build Errors
**Problem:** Android build fails with Gradle errors
**Solution:**
```bash
# Update Android dependencies
cd android && ./gradlew clean && cd ..

# Check for conflicting dependencies
npm ls react-native

# Reinstall platform
expo prebuild --clean
```

### Deployment Problems

#### App Not Updating
**Problem:** Production app doesn't reflect latest changes
**Solution:**
```bash
# Check release channel
expo publish --release-channel production

# Verify OTA updates
expo publish:history

# Force app refresh
// In app: Pull to refresh or restart
```

## Performance Problems

### Slow Load Times

#### Component Rendering Delays
**Problem:** UI components render slowly
**Solution:**
```typescript
// Optimize expensive components
const MemoizedComponent = React.memo(ExpensiveComponent);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);

// Implement virtualized lists for large datasets
import { FlatList } from 'react-native';
```

#### Database Query Performance
**Problem:** Slow database queries
**Solution:**
```sql
-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON auction_bids(auction_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM auctions WHERE status = 'active';
```

### Memory Leaks

#### Increasing Memory Usage
**Problem:** App memory usage grows over time
**Solution:**
```typescript
// Properly clean up subscriptions
useEffect(() => {
  const subscription = someObservable.subscribe();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Use WeakMap for caching
const cache = new WeakMap();
```

## Common Error Codes

### Supabase Error Codes
- **42501**: Insufficient privileges (RLS policy violation)
- **23505**: Duplicate key value violates unique constraint
- **23503**: Foreign key constraint violation
- **PGRST204**: Schema cache mismatch

### React Native Errors
- **Invariant Violation**: Component hierarchy issues
- **TypeError**: Undefined function or property access
- **Network Error**: Connectivity issues

## Debugging Tools

### Logging
```typescript
// Enable detailed logging
console.log('Debug info:', { variable1, variable2 });

// Use React Developer Tools
// Install React DevTools extension
```

### Performance Monitoring
```bash
# Profile bundle size
npx expo-optimize --analyze

# Monitor network requests
# Use React Native Debugger or Flipper
```

### Database Debugging
```sql
-- Enable query logging
SET log_statement = 'all';

-- Monitor active connections
SELECT * FROM pg_stat_activity;
```