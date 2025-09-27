// Automatic mock for @supabase/supabase-js
const mockSupabaseClient = {
  from: jest.fn(),
}

// Mock the createClient function to return our mock client
const createClient = jest.fn(() => mockSupabaseClient)

export { createClient, mockSupabaseClient }