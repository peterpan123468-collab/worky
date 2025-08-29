# Worky App Authentication Issue - User Guide

## 🚨 Issue: "Cannot coerce the result to a single JSON object" Error

### What's Happening?

If you're seeing error code **PGRST116** or a message about "Cannot coerce the result to a single JSON object", it means your user account exists in our authentication system, but there's a missing piece in our database. This is a technical issue that we can fix easily.

### Quick Fix Options

#### Option 1: Automatic Fix (Recommended)
1. If you're stuck on the login screen, look for the **🛠️ Emergency Fix** link at the bottom
2. Click it to go to the Emergency Fix page
3. Click **"Fix My Account"** - this will automatically set up your missing profile
4. The page will reload and you should be able to use the app normally

#### Option 2: Choose Your Account Type
If the automatic fix doesn't work:
1. Go to the Emergency Fix page (link appears when you get the error)
2. Choose either **"I'm a Customer"** or **"I'm a Handyman"**
3. Your account will be set up with the correct type
4. The page will reload automatically

#### Option 3: Browser Console Fix (For Advanced Users)
1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Type: `window.debugUtils.emergencyUserFix()`
4. Press Enter
5. Follow any popup instructions

### For Developers

If you have console access, you can use these debug commands:

```javascript
// Check if user record exists
window.debugUtils.checkUserRecord('user-id-here')

// Fix current user (automatic)
window.debugUtils.emergencyUserFix()

// Set user type manually
window.debugUtils.updateUserType('customer') // or 'handyman'

// Fix for current logged-in user
window.debugUtils.fixCurrentUserRecord('customer') // or 'handyman'
```

### Why This Happens

This issue occurs when:
1. **New User Registration**: The database trigger that creates your profile didn't complete properly
2. **Timing Issue**: Your browser tried to load your profile before it was fully created
3. **Database Migration**: If the database was updated and existing users weren't migrated properly

### Prevention

To prevent this issue in the future:
1. **Wait for Confirmation**: After registering, wait for the "Account created successfully" message before proceeding
2. **Stable Connection**: Ensure you have a stable internet connection during registration
3. **Single Tab**: Keep only one tab open during the registration process

### Step-by-Step Recovery Guide

#### If you're currently experiencing this issue:

**Step 1: Try Automatic Recovery**
- The app now automatically tries to create your missing profile
- Wait 2-3 seconds after logging in to see if it resolves automatically

**Step 2: Use Emergency Fix**
- If automatic recovery fails, you'll see an "Emergency Fix" option
- Click it and follow the guided repair process

**Step 3: Manual Account Type Selection**
- Choose "Customer" if you need help with tasks
- Choose "Handyman" if you want to offer services
- You can change this later in your profile settings

**Step 4: Contact Support (Last Resort)**
- If none of the above work, please contact support
- Include your email address and the exact error message
- We can manually fix your account within 24 hours

### Technical Details (For Developers)

The issue stems from a race condition between:
1. Supabase Auth creating the user in `auth.users` table
2. Database trigger creating the profile in `public.users` table
3. App trying to fetch user_type immediately after login

**Database Fix Required:**
Update your Supabase database trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    user_type_value TEXT;
BEGIN
    user_type_value := COALESCE(
        (NEW.raw_user_meta_data->>'user_type'),
        'customer'
    );
    
    IF user_type_value NOT IN ('handyman', 'customer') THEN
        user_type_value := 'customer';
    END IF;
    
    INSERT INTO public.users (id, email, user_type)
    VALUES (NEW.id, NEW.email, user_type_value);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**App-Level Fixes:**
- Enhanced retry logic in AuthContext
- Automatic user record creation on login
- Emergency fix utilities
- Better error messages and user guidance

### Success Indicators

You'll know the issue is fixed when:
✅ Login completes without errors
✅ You're redirected to the appropriate dashboard (Customer or Handyman)
✅ Your profile loads correctly
✅ No PGRST116 errors in browser console

### Still Having Issues?

If you've tried all the above solutions and still can't access your account:

1. **Clear Browser Data**: Clear your browser's cache and cookies for the app
2. **Try Incognito Mode**: Test in a private/incognito browser window
3. **Different Browser**: Try a different web browser
4. **Logout/Login**: Use the logout option and try logging in again
5. **Create New Account**: As a last resort, create a new account with a different email

Remember: This is a one-time setup issue. Once fixed, your account will work normally going forward!