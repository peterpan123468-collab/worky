// Manual mock for src/lib/supabase.ts
const mockFrom = jest.fn()

const supabase = {
  from: mockFrom,
}

export { supabase }