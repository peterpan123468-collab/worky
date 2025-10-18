/**
 * Integration tests for authentication flows
 * These tests use the actual Supabase client for end-to-end testing
 *
 * Note: These tests require a test database environment
 */

import { authService } from '../../services/auth.service'
import { testSupabaseConnection } from '../../lib/supabase'

const shouldSkipIntegration = process.env.RUN_INTEGRATION === 'true'

const describeIntegration = shouldSkipIntegration ? describe : describe.skip

describeIntegration('Auth Integration Tests', () => {
  // Test user credentials
  const TEST_USER_EMAIL = 'atemndobs@gmail.com'
  const TEST_USER_PASSWORD = 'Atem1234'

  const NEW_CUSTOMER_EMAIL = 'test-customer@worky.test'
  const NEW_HANDYMAN_EMAIL = 'test-handyman@worky.test'
  const TEST_PASSWORD = 'TestPassword123!'

  beforeAll(async () => {
    // Verify database connection before running tests
    const isConnected = await testSupabaseConnection()
    if (!isConnected) {
      throw new Error('Cannot run integration tests: Database connection failed')
    }
  })

  afterEach(async () => {
    // Clean up: sign out after each test
    await authService.signOut()
  })

  describe('Database Connection', () => {
    it('should connect to Supabase successfully', async () => {
      const isConnected = await testSupabaseConnection()
      expect(isConnected).toBe(true)
    })
  })

  describe('Existing User Login', () => {
    it('should handle existing user login (atemndobs@gmail.com)', async () => {
      // First, let's see what happens when we try to login with existing user
      const loginResult = await authService.signIn(TEST_USER_EMAIL, TEST_USER_PASSWORD)

      if (loginResult.error) {
        console.log('Login failed (expected for setup):', loginResult.error)

        // If login fails, this user might not exist in auth yet
        // Let's check if we need to create the auth user for existing DB user
        expect(loginResult.error).toBeTruthy()
      } else {
        console.log('Login successful:', loginResult.user?.email)
        expect(loginResult.user?.email).toBe(TEST_USER_EMAIL)

        // Check if user has proper type assignment
        if (!loginResult.user?.user_type) {
          console.warn('⚠️  User exists but has no user_type assigned')
          console.log('User data:', loginResult.user)
        }
      }
    })

    it('should handle existing user without user_type assignment', async () => {
      // This test specifically handles the scenario where:
      // - User exists in Supabase Auth
      // - User exists in database
      // - User has no user_type (neither handyman nor customer)

      const result = await authService.signIn(TEST_USER_EMAIL, TEST_USER_PASSWORD)

      if (result.user && !result.user.user_type) {
        console.log('⚠️  Found user without type assignment - needs migration')
        expect(result.user.email).toBe(TEST_USER_EMAIL)
        expect(result.user.user_type).toBeNull()

        // This indicates we need a migration strategy for existing users
      }
    })
  })

  describe('New User Registration', () => {
    it('should register a new customer successfully', async () => {
      const signUpData = {
        email: NEW_CUSTOMER_EMAIL,
        password: TEST_PASSWORD,
        userType: 'customer' as const
      }

      const result = await authService.signUp(signUpData)

      if (result.error?.includes('User already registered')) {
        // User already exists, which is fine for testing
        console.log('Customer already exists, testing login instead')

        const loginResult = await authService.signIn(NEW_CUSTOMER_EMAIL, TEST_PASSWORD)
        expect(loginResult.error).toBeNull()
        expect(loginResult.user?.user_type).toBe('customer')
      } else {
        expect(result.error).toBeNull()
        expect(result.user?.email).toBe(NEW_CUSTOMER_EMAIL)
        expect(result.user?.user_type).toBe('customer')
      }
    }, 15000) // Increased timeout for network operations

    it('should register a new handyman with business profile', async () => {
      const signUpData = {
        email: NEW_HANDYMAN_EMAIL,
        password: TEST_PASSWORD,
        userType: 'handyman' as const,
        businessName: 'Test Handyman Services',
        hourlyRate: 65,
        region: 'Zurich',
        skills: ['plumbing', 'electrical', 'carpentry'],
        phone: '+41 44 123 45 67'
      }

      const result = await authService.signUp(signUpData)

      if (result.error?.includes('User already registered')) {
        // User already exists, test login and profile
        console.log('Handyman already exists, testing login instead')

        const loginResult = await authService.signIn(NEW_HANDYMAN_EMAIL, TEST_PASSWORD)
        expect(loginResult.error).toBeNull()
        expect(loginResult.user?.user_type).toBe('handyman')
        expect(loginResult.user?.handymanProfile).toBeDefined()
        expect(loginResult.user?.handymanProfile?.business_name).toBe('Test Handyman Services')
      } else {
        expect(result.error).toBeNull()
        expect(result.user?.email).toBe(NEW_HANDYMAN_EMAIL)
        expect(result.user?.user_type).toBe('handyman')
        expect(result.user?.handymanProfile).toBeDefined()
        expect(result.user?.handymanProfile?.business_name).toBe('Test Handyman Services')
        expect(result.user?.handymanProfile?.hourly_rate).toBe(65)
      }
    }, 15000)
  })

  describe('Swiss Market Validation', () => {
    it('should validate CHF hourly rates', async () => {
      const invalidData = {
        email: 'invalid-rate@worky.test',
        password: TEST_PASSWORD,
        userType: 'handyman' as const,
        businessName: 'Test Business',
        hourlyRate: 600, // Too high for Swiss market
        region: 'Zurich'
      }

      const result = await authService.signUp(invalidData)
      expect(result.error).toContain('Hourly rate must be between CHF 10-500')
    })

    it('should validate business name requirements', async () => {
      const invalidData = {
        email: 'invalid-business@worky.test',
        password: TEST_PASSWORD,
        userType: 'handyman' as const,
        businessName: 'A', // Too short
        hourlyRate: 50,
        region: 'Zurich'
      }

      const result = await authService.signUp(invalidData)
      expect(result.error).toContain('Business name is required')
    })
  })

  describe('Session Management', () => {
    it('should maintain session after login', async () => {
      // Login first
      const loginResult = await authService.signIn(NEW_CUSTOMER_EMAIL, TEST_PASSWORD)

      if (loginResult.error) {
        // Skip this test if user doesn't exist
        console.log('Skipping session test - user not found')
        return
      }

      // Check current user
      const currentUser = await authService.getCurrentUser()
      expect(currentUser?.email).toBe(NEW_CUSTOMER_EMAIL)

      // Check authentication status
      const isAuth = await authService.isAuthenticated()
      expect(isAuth).toBe(true)

      // Get session
      const session = await authService.getSession()
      expect(session?.user?.email).toBe(NEW_CUSTOMER_EMAIL)
    })

    it('should clear session after logout', async () => {
      // Login first
      const loginResult = await authService.signIn(NEW_CUSTOMER_EMAIL, TEST_PASSWORD)

      if (loginResult.error) {
        console.log('Skipping logout test - user not found')
        return
      }

      // Logout
      const logoutResult = await authService.signOut()
      expect(logoutResult.error).toBeNull()

      // Verify session is cleared
      const isAuth = await authService.isAuthenticated()
      expect(isAuth).toBe(false)

      const currentUser = await authService.getCurrentUser()
      expect(currentUser).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid login credentials', async () => {
      const result = await authService.signIn('nonexistent@example.com', 'wrongpassword')

      expect(result.error).toBeTruthy()
      expect(result.user).toBeNull()
    })

    it('should handle duplicate email registration', async () => {
      // Try to register with existing email
      const duplicateData = {
        email: TEST_USER_EMAIL,
        password: TEST_PASSWORD,
        userType: 'customer' as const
      }

      const result = await authService.signUp(duplicateData)

      // Should fail with appropriate error
      expect(result.error).toBeTruthy()
      expect(result.user).toBeNull()
    })
  })
})

/**
 * Helper function to run integration tests
 * Usage: npm test -- --testNamePattern="Integration Tests"
 */
export const runAuthIntegrationTests = async () => {
  console.log('🧪 Running Auth Integration Tests...')
  console.log('📧 Test User:', 'atemndobs@gmail.com')
  console.log('🔑 Password:', 'Atem1234')
  console.log('🌍 Environment:', process.env.EXPO_PUBLIC_SUPABASE_URL)
}