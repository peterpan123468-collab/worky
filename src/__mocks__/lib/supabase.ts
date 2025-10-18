const chain = () => {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    update: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
  }
  return builder
}

const mockFrom = jest.fn(() => chain())
const mockChannel = jest.fn(() => ({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  unsubscribe: jest.fn(),
}))
const mockRemoveChannel = jest.fn()

const supabase = {
  from: mockFrom,
  channel: mockChannel,
  removeChannel: mockRemoveChannel,
}

export { supabase }
