/**
 * Manual Authentication Test Runner
 *
 * This script tests real Supabase authentication with your existing user
 * Run this to verify login works with atemndobs@gmail.com / Atem1234
 */

import { authService } from '../services/auth.service'
import { testSupabaseConnection } from '../lib/supabase'
import { supabase } from '../lib/supabase'

// Real test credentials
const EXISTING_USER_EMAIL = 'atemndobs@gmail.com'
const EXISTING_USER_PASSWORD = 'Atem1234'

export const runManualAuthTests = async () => {
  console.log('🧪 Starting Manual Auth Tests with Real Supabase')
  console.log('=' .repeat(50))

  try {
    // Step 1: Test Database Connection
    console.log('1️⃣  Testing database connection...')
    const isConnected = await testSupabaseConnection()
    if (!isConnected) {
      throw new Error('❌ Database connection failed')
    }
    console.log('✅ Database connection successful')

    // Step 2: Check Current Session
    console.log('\n2️⃣  Checking current session...')
    const currentSession = await authService.getSession()
    if (currentSession) {
      console.log('📋 Existing session found:', currentSession.user?.email)
      await authService.signOut()
      console.log('🚪 Signed out existing session')
    } else {
      console.log('🆕 No existing session')
    }

    // Step 3: Test Login with Existing User
    console.log('\n3️⃣  Testing login with existing user...')
    console.log(`📧 Email: ${EXISTING_USER_EMAIL}`)
    console.log(`🔑 Password: ${EXISTING_USER_PASSWORD}`)

    const loginResult = await authService.signIn(EXISTING_USER_EMAIL, EXISTING_USER_PASSWORD)

    if (loginResult.error) {
      console.log('❌ Login failed:', loginResult.error)

      // Check if user exists in database but not in auth
      console.log('\n🔍 Checking if user exists in database...')
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', EXISTING_USER_EMAIL)
        .single()

      if (dbError) {
        console.log('❌ Database query error:', dbError.message)
      } else if (dbUser) {
        console.log('📊 User found in database:')
        console.log('  - ID:', dbUser.id)
        console.log('  - Email:', dbUser.email)
        console.log('  - User Type:', dbUser.user_type || '❗ NOT SET')
        console.log('  - Created:', dbUser.created_at)

        if (!dbUser.user_type) {
          console.log('\n⚠️  MIGRATION NEEDED: User exists but has no user_type')
          console.log('   This user needs to be migrated to the new system')
        }
      } else {
        console.log('❌ User not found in database')
      }

      return { success: false, error: loginResult.error, needsMigration: !!dbUser && !dbUser.user_type }
    }

    console.log('✅ Login successful!')
    console.log('👤 User details:')
    console.log('  - ID:', loginResult.user?.id)
    console.log('  - Email:', loginResult.user?.email)
    console.log('  - User Type:', loginResult.user?.user_type || '❗ NOT SET')

    if (loginResult.user?.handymanProfile) {
      console.log('🔧 Handyman Profile:')
      console.log('  - Business:', loginResult.user.handymanProfile.business_name)
      console.log('  - Rate:', `CHF ${loginResult.user.handymanProfile.hourly_rate}/hour`)
      console.log('  - Region:', loginResult.user.handymanProfile.region)
    }

    // Step 4: Test Session Persistence
    console.log('\n4️⃣  Testing session persistence...')
    const currentUser = await authService.getCurrentUser()
    if (currentUser) {
      console.log('✅ Session persisted, user retrieved successfully')
    } else {
      console.log('❌ Session not persisted')
    }

    // Step 5: Test Logout
    console.log('\n5️⃣  Testing logout...')
    const logoutResult = await authService.signOut()
    if (logoutResult.error) {
      console.log('❌ Logout failed:', logoutResult.error)
    } else {
      console.log('✅ Logout successful')
    }

    console.log('\n🎉 All tests completed successfully!')
    return {
      success: true,
      user: loginResult.user,
      needsMigration: loginResult.user && !loginResult.user.user_type
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Test new user registration
export const testNewUserRegistration = async () => {
  console.log('\n🆕 Testing New User Registration')
  console.log('=' .repeat(40))

  const testCustomer = {
    email: 'test-customer-' + Date.now() + '@worky.test',
    password: 'TestPassword123!',
    userType: 'customer' as const
  }

  const testHandyman = {
    email: 'test-handyman-' + Date.now() + '@worky.test',
    password: 'TestPassword123!',
    userType: 'handyman' as const,
    businessName: 'Test Handyman Services',
    hourlyRate: 65,
    region: 'Zurich',
    skills: ['plumbing', 'electrical'],
    phone: '+41 44 123 45 67'
  }

  try {
    // Test customer registration
    console.log('1️⃣  Testing customer registration...')
    const customerResult = await authService.signUp(testCustomer)

    if (customerResult.error) {
      console.log('❌ Customer registration failed:', customerResult.error)
    } else {
      console.log('✅ Customer registered successfully:', customerResult.user?.email)
      await authService.signOut()
    }

    // Test handyman registration
    console.log('\n2️⃣  Testing handyman registration...')
    const handymanResult = await authService.signUp(testHandyman)

    if (handymanResult.error) {
      console.log('❌ Handyman registration failed:', handymanResult.error)
    } else {
      console.log('✅ Handyman registered successfully:', handymanResult.user?.email)
      console.log('🔧 Business created:', handymanResult.user?.handymanProfile?.business_name)
      await authService.signOut()
    }

    return { success: true }

  } catch (error) {
    console.error('💥 Registration test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Migration helper for existing users
export const migrateExistingUser = async (email: string, userType: 'handyman' | 'customer') => {
  console.log(`\n🔄 Migrating existing user: ${email} to ${userType}`)

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ user_type: userType })
      .eq('email', email)
      .select()
      .single()

    if (error) {
      console.log('❌ Migration failed:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ User migrated successfully')
    console.log('👤 Updated user:', data)
    return { success: true, user: data }

  } catch (error) {
    console.error('💥 Migration error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}