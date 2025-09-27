import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
// Note: For now we'll create client without strict typing to avoid type conflicts
// import { Database } from '../types/database.types'

// Environment variables from .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with React Native specific configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time events (auction bidding)
    }
  }
})

// Type-safe database client export
export type SupabaseClient = typeof supabase

// Connection test function for development
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple connection test - just check if we can make a query
    // Use a publicly readable table under RLS policies
    const { data, error } = await supabase
      .from('handyman_profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}
