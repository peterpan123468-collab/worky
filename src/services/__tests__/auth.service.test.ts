import { AuthService, AuthError, ValidationError } from '../auth.service'
import {
  createMockSupabaseClient,
  createMockUser,
  createMockHandymanProfile,
  createMockAuthResponse,
  createMockSupabaseError
} from '../../test/mocks/supabase.mock'

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: createMockSupabaseClient()
}))

describe('AuthService', () => {
  let authService: AuthService
  let mockSupabase: any

  beforeEach(() => {
    authService = new AuthService()
    mockSupabase = require('../../lib/supabase').supabase
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    const validSignUpData = {
      email: 'test@example.com',
      password: 'password123',
      userType: 'customer' as const
    }

    const validHandymanData = {
      email: 'handyman@example.com',
      password: 'password123',
      userType: 'handyman' as const,
      businessName: 'Test Business',
      hourlyRate: 50,
      region: 'Zurich',
      skills: ['plumbing'],
      phone: '+41123456789'
    }

    it('should sign up a customer successfully', async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ id: mockUser.id, email: mockUser.email })
      )
      mockSupabase.__mocks.single.mockResolvedValue({ data: mockUser, error: null })

      const result = await authService.signUp(validSignUpData)

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validSignUpData.email,
        password: validSignUpData.password,
        options: {
          data: {
            user_type: 'customer',
            email: validSignUpData.email
          }
        }
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should sign up a handyman with profile creation', async () => {
      const mockUser = createMockUser()
      const mockProfile = createMockHandymanProfile()

      mockSupabase.auth.signUp.mockResolvedValue(
        createMockAuthResponse({ id: mockUser.id, email: mockUser.email })
      )
      mockSupabase.__mocks.single
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockProfile, error: null })

      const result = await authService.signUp(validHandymanData)

      expect(result.error).toBeNull()
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSupabase.from).toHaveBeenCalledWith('handyman_profiles')
    })

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        userType: 'customer' as const
      }

      const result = await authService.signUp(invalidData)

      expect(result.error).toBeTruthy()
      expect(result.user).toBeNull()
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    it('should handle Supabase auth errors', async () => {
      const authError = createMockSupabaseError('Email already exists', 'USER_ALREADY_EXISTS')
      mockSupabase.auth.signUp.mockResolvedValue(
        createMockAuthResponse(null, authError)
      )

      const result = await authService.signUp(validSignUpData)

      expect(result.error).toBe('Email already exists')
      expect(result.user).toBeNull()
    })

    it('should validate handyman business requirements', async () => {
      const invalidHandymanData = {
        email: 'handyman@example.com',
        password: 'password123',
        userType: 'handyman' as const,
        businessName: 'A', // Too short
        hourlyRate: 5 // Too low
      }

      const result = await authService.signUp(invalidHandymanData)

      expect(result.error).toContain('Business name is required')
      expect(result.user).toBeNull()
    })

    it('should validate Swiss market hourly rates', async () => {
      const invalidRateData = {
        ...validHandymanData,
        hourlyRate: 600 // Too high for Swiss market
      }

      const result = await authService.signUp(invalidRateData)

      expect(result.error).toContain('Hourly rate must be between CHF 10-500')
      expect(result.user).toBeNull()
    })
  })

  describe('signIn', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    it('should sign in successfully', async () => {
      const mockUser = createMockUser()
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse({ id: mockUser.id, email: mockUser.email })
      )
      mockSupabase.__mocks.single.mockResolvedValue({ data: mockUser, error: null })

      const result = await authService.signIn(validCredentials.email, validCredentials.password)

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password
      })
    })

    it('should handle invalid credentials', async () => {
      const authError = createMockSupabaseError('Invalid credentials', 'INVALID_CREDENTIALS')
      mockSupabase.auth.signInWithPassword.mockResolvedValue(
        createMockAuthResponse(null, authError)
      )

      const result = await authService.signIn(validCredentials.email, 'wrongpassword')

      expect(result.error).toBe('Invalid credentials')
      expect(result.user).toBeNull()
    })

    it('should handle network errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Network error'))

      const result = await authService.signIn(validCredentials.email, validCredentials.password)

      expect(result.error).toBe('An unexpected error occurred during login')
      expect(result.user).toBeNull()
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await authService.signOut()

      expect(result.error).toBeNull()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      const signOutError = createMockSupabaseError('Sign out failed', 'SIGNOUT_ERROR')
      mockSupabase.auth.signOut.mockResolvedValue({ error: signOutError })

      const result = await authService.signOut()

      expect(result.error).toBe('Sign out failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user with handyman profile', async () => {
      const mockUser = { ...createMockUser(), user_type: 'handyman' }
      const mockProfile = createMockHandymanProfile()

      mockSupabase.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ id: mockUser.id })
      )
      mockSupabase.__mocks.single
        .mockResolvedValueOnce({ data: mockUser, error: null })
        .mockResolvedValueOnce({ data: mockProfile, error: null })

      const result = await authService.getCurrentUser()

      expect(result).toEqual({
        ...mockUser,
        handymanProfile: mockProfile
      })
    })

    it('should return customer without profile', async () => {
      const mockUser = { ...createMockUser(), user_type: 'customer' }

      mockSupabase.auth.getUser.mockResolvedValue(
        createMockAuthResponse({ id: mockUser.id })
      )
      mockSupabase.__mocks.single.mockResolvedValue({ data: mockUser, error: null })

      const result = await authService.getCurrentUser()

      expect(result).toEqual(mockUser)
      expect(result?.handymanProfile).toBeUndefined()
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue(
        createMockAuthResponse(null)
      )

      const result = await authService.getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('validation', () => {
    it('should validate email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        userType: 'customer' as const
      }

      expect(async () => {
        await authService.signUp(invalidData)
      }).rejects.toThrow(ValidationError)
    })

    it('should validate password length', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        userType: 'customer' as const
      }

      expect(async () => {
        await authService.signUp(invalidData)
      }).rejects.toThrow('Password must be at least 6 characters')
    })

    it('should validate user type', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        userType: 'invalid' as any
      }

      expect(async () => {
        await authService.signUp(invalidData)
      }).rejects.toThrow('Valid user type is required')
    })
  })

  describe('updateHandymanProfile', () => {
    it('should update handyman profile successfully', async () => {
      const userId = 'test-user-id'
      const updates = { hourly_rate: 75, business_name: 'Updated Business' }

      mockSupabase.__mocks.update.mockResolvedValue({ error: null })

      const result = await authService.updateHandymanProfile(userId, updates)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('handyman_profiles')
    })

    it('should handle update errors', async () => {
      const userId = 'test-user-id'
      const updates = { hourly_rate: 75 }
      const updateError = createMockSupabaseError('Update failed')

      mockSupabase.__mocks.update.mockResolvedValue({ error: updateError })

      const result = await authService.updateHandymanProfile(userId, updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update profile')
    })
  })
})