# Authentication Testing Guide

This guide explains how to test the Worky authentication system, including handling the existing user `atemndobs@gmail.com`.

## 🧪 Testing Strategy

### **Why Two Types of Tests?**

1. **Unit Tests (Mocked)** - Fast, isolated testing of business logic
2. **Integration Tests (Real Supabase)** - End-to-end testing with actual database

You're right to question mocking - we need **both** to ensure everything works!

## 📱 Manual Testing (Recommended)

### **Option 1: In-App Testing Interface**

1. **Start the app**: `npm start`
2. **Open app** in simulator/device
3. **Tap "🧪 Test Auth"** button on welcome screen
4. **Run tests** with real Supabase connection

### **Option 2: Command Line Testing**

```bash
# Type check
npm run type-check

# Run unit tests (business logic)
npm test

# Run integration tests (real database)
npm run test:integration
```

## 🔐 Testing with Existing User

### **User Credentials**
- **Email**: `atemndobs@gmail.com`
- **Password**: `Atem1234`

### **Expected Scenarios**

#### **Scenario 1: User Exists but No `user_type`**
```typescript
// If user exists in database but user_type is null
{
  id: "uuid",
  email: "atemndobs@gmail.com",
  user_type: null,  // ⚠️ NEEDS MIGRATION
  created_at: "...",
  updated_at: "..."
}
```

**What happens**: Login will work but user needs type assignment.

#### **Scenario 2: User Doesn't Exist in Auth**
**What happens**: Login fails, need to create auth user for existing DB user.

#### **Scenario 3: User Fully Migrated**
```typescript
{
  id: "uuid",
  email: "atemndobs@gmail.com",
  user_type: "customer", // ✅ MIGRATED
  created_at: "...",
  updated_at: "..."
}
```

**What happens**: Login works perfectly.

## 🔄 User Migration Process

### **Automatic Migration via App**

1. **Try Login**: Use the test interface
2. **Check Result**: App will detect if migration needed
3. **Choose Type**: Select "Customer" or "Handyman"
4. **Migrate**: App updates database automatically

### **Manual Migration via Database**

```sql
-- Update existing user type
UPDATE users
SET user_type = 'customer'  -- or 'handyman'
WHERE email = 'atemndobs@gmail.com';
```

### **Migration Helper Function**

```typescript
// Available in test interface
await migrateExistingUser('atemndobs@gmail.com', 'customer')
```

## 🧩 Test Coverage

### **Unit Tests** (`src/services/__tests__/auth.service.test.ts`)

✅ **What's Tested**:
- Input validation (email format, password length)
- Swiss market validation (CHF rates, business names)
- Error handling (network errors, auth failures)
- Business logic (profile creation, user types)

❌ **What's NOT Tested**:
- Real database connections
- Actual Supabase responses
- Network conditions

### **Integration Tests** (`src/test/integration/auth.integration.test.ts`)

✅ **What's Tested**:
- Real Supabase connection
- Actual user login/registration
- Database queries and responses
- Session management
- Swiss market compliance with real data

❌ **What's NOT Tested**:
- UI interactions
- Navigation flows
- Error UI states

### **Manual Tests** (`TestAuthScreen`)

✅ **What's Tested**:
- Complete user flow
- Real UI interactions
- Error handling in app context
- Migration workflows
- Swiss market edge cases

## 📊 Test Results Interpretation

### **Successful Login**
```
✅ Login successful!
👤 User details:
  - ID: uuid-123
  - Email: atemndobs@gmail.com
  - User Type: customer
```

### **Migration Needed**
```
⚠️ MIGRATION NEEDED: User exists but has no user_type
   This user needs to be migrated to the new system
```

### **Auth Error**
```
❌ Login failed: Invalid login credentials
🔍 Checking if user exists in database...
📊 User found in database:
  - ID: uuid-123
  - Email: atemndobs@gmail.com
  - User Type: ❗ NOT SET
```

## 🛠️ Troubleshooting

### **"Database connection failed"**
- Check `.env` file has correct Supabase credentials
- Verify Supabase project is active
- Test internet connection

### **"User not found"**
- User might not exist in Supabase Auth
- User might exist in database but not auth system
- Check user email spelling

### **"Invalid credentials"**
- Password might be incorrect
- User might be disabled in Supabase Auth
- Check caps lock, special characters

### **TypeScript Errors**
```bash
npm run type-check
```

### **Test Failures**
```bash
# Clear Jest cache
npx jest --clearCache

# Run specific test
npm test -- --testNamePattern="signIn"
```

## 🔒 Security Considerations

### **Test Environment**
- Tests use **real production database**
- Be careful with test data
- Don't commit sensitive test data

### **User Migration**
- Migration preserves all existing user data
- Only adds `user_type` field
- No data is deleted or modified

### **Credentials**
- Test credentials are for development only
- Production will use real user accounts
- Never commit real passwords to code

## 📈 Performance Testing

### **Load Testing Checklist**
- [ ] Multiple concurrent logins
- [ ] Session persistence across app restarts
- [ ] Network interruption handling
- [ ] Database timeout scenarios

### **Swiss Market Testing**
- [ ] CHF currency validation
- [ ] Business hour restrictions
- [ ] Timezone handling (Europe/Zurich)
- [ ] Language preference handling

## 🚀 Ready for Phase 3

Once authentication testing is complete and existing user migration is handled, we're ready for **Phase 3: Core Auction System**.

### **Prerequisites Checklist**
- [ ] Existing user `atemndobs@gmail.com` can login
- [ ] User has proper `user_type` assignment
- [ ] New user registration works
- [ ] Session management functions correctly
- [ ] Swiss market validation works

---

**Next Steps**: Run the manual test interface and verify your existing user works correctly!