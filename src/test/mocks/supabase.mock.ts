// Mock Supabase client for testing
export const createMockSupabaseClient = () => {
  const singleQueue: Array<() => Promise<any>> = []
  const queryQueue: Array<() => Promise<any>> = []

  const createBuilder = () => {
    const builder: any = {}
    builder.__queuedResults = []

    builder.select = jest.fn(() => builder)
    builder.insert = jest.fn(() => builder)
    builder.update = jest.fn(() => builder)
    builder.delete = jest.fn(() => builder)
    builder.eq = jest.fn(() => builder)
    builder.limit = jest.fn(() => builder)
    builder.order = jest.fn(() => builder)

    builder.single = jest.fn(() => {
      console.log('mock single queue', singleQueue.length)
      const next = singleQueue.shift()
      return next ? next() : Promise.resolve({ data: null, error: null })
    })

    builder.then = jest.fn((resolve: (value: any) => void, reject?: (reason: any) => void) => {
      if (builder.__queuedResults.length > 0) {
        return Promise.resolve(builder.__queuedResults.shift()).then(resolve, reject)
      }
      const next = queryQueue.shift()
      const promise = next ? next() : Promise.resolve({ data: null, error: null })
      return promise.then(resolve, reject)
    })

    builder.catch = jest.fn((reject: (reason: any) => void) => {
      if (builder.__queuedResults.length > 0) {
        return Promise.resolve(builder.__queuedResults.shift()).catch(reject)
      }
      const next = queryQueue.shift()
      const promise = next ? next() : Promise.resolve({ data: null, error: null })
      return promise.catch(reject)
    })

    return builder
  }

  const queryBuilder = createBuilder()

  const enqueueSingle = (value: any) => {
    singleQueue.push(() => Promise.resolve(value))
  }

  const enqueueQueryResult = (value: any) => {
    queryBuilder.__queuedResults.push(value)
  }

  const mockFrom = jest.fn(() => queryBuilder)

  const mockAuth = {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
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
    __mocks: {
      builder: queryBuilder,
      resetQueues: () => {
        singleQueue.length = 0
        queryQueue.length = 0
        queryBuilder.__queuedResults.length = 0
      },
      select: queryBuilder.select,
      insert: queryBuilder.insert,
      update: queryBuilder.update,
      delete: queryBuilder.delete,
      eq: queryBuilder.eq,
      single: queryBuilder.single,
      limit: queryBuilder.limit,
      order: queryBuilder.order,
      from: mockFrom,
      auth: mockAuth,
      enqueueSingle,
      enqueueQueryResult
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
