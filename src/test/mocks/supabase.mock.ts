// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const mockSelect = jest.fn().mockReturnThis()
  const mockInsert = jest.fn().mockReturnThis()
  const mockUpdate = jest.fn().mockReturnThis()
  const mockDelete = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockSingle = jest.fn()
  const mockLimit = jest.fn().mockReturnThis()

  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    limit: mockLimit
  }))

  const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    admin: {
      deleteUser: jest.fn()
    }
  }

  return {
    from: mockFrom,
    auth: mockAuth,
    // Helper methods for testing
    __mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      limit: mockLimit,
      from: mockFrom,
      auth: mockAuth
    }
  }
}

// Mock user data
export const createMockUser = () => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_type: 'customer' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createMockHandymanProfile = () => ({
  id: 'test-profile-id',
  user_id: 'test-user-id',
  business_name: 'Test Business',
  hourly_rate: 50,
  region: 'Zurich',
  skills: ['plumbing', 'electrical'],
  description: 'Test handyman',
  phone: '+41123456789',
  default_auction_duration: 60,
  min_bid_increment: 5.00,
  calendar_integration_enabled: false,
  auto_confirm_calendar_bookings: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

// Mock auth responses
export const createMockAuthResponse = (user: any = null, error: any = null) => ({
  data: { user, session: user ? { user } : null },
  error
})

export const createMockSupabaseError = (message: string, code?: string) => ({
  message,
  name: code || 'SupabaseError',
  code
})