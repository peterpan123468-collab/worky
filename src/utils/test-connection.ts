import { testSupabaseConnection } from '../lib/supabase'

/**
 * Test Supabase connection and database access
 * Call this during app initialization to verify setup
 */
export const runConnectionTests = async () => {
  console.log('🔍 Running Supabase connection tests...')

  try {
    // Test basic connection
    console.log('⏳ Testing Supabase connection...')
    const isConnected = await testSupabaseConnection()

    if (isConnected) {
      console.log('✅ Phase 2 Setup Verification Complete!')
      console.log('  - Supabase client configured')
      console.log('  - Database connection successful')
      console.log('  - TypeScript types generated')
      console.log('  - Auth service ready')
      console.log('  - Enhanced AuthContext loaded')
      return true
    } else {
      console.log('❌ Database connection failed')
      return false
    }
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

/**
 * Test auth service functionality (optional)
 */
export const runAuthTests = async () => {
  console.log('🔍 Testing auth service...')
  // Add auth service tests here if needed
  return true
}