import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
// Note: For now we'll create client without strict typing to avoid type conflicts
// import { Database } from '../types/database.types'

console.log('[Supabase] Initializing Supabase client...')
console.log('[Supabase] Platform:', Platform.OS)
console.log('[Supabase] User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available (native)')

// Environment variables from .env
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('[Supabase] Environment variables:')
console.log('[Supabase] URL present:', !!supabaseUrl)
console.log('[Supabase] Key present:', !!supabaseAnonKey)
console.log('[Supabase] URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING')

// Platform-specific environment variable loading
if (Platform.OS !== 'web') {
  console.log('[Supabase] Native platform - checking if env vars loaded properly')
  if (!supabaseUrl) {
    console.warn('[Supabase] ⚠️  Supabase URL not found in native environment')
  }
  if (!supabaseAnonKey) {
    console.warn('[Supabase] ⚠️  Supabase Anon Key not found in native environment')
  }
}

if ((!supabaseUrl || !supabaseAnonKey) && typeof process !== 'undefined' && process.release?.name === 'node') {
  try {
    const fs = eval('require')('fs') as typeof import('fs')
    const path = eval('require')('path') as typeof import('path')
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const envContents = fs.readFileSync(envPath, 'utf8')
      envContents.split(/\r?\n/).forEach(line => {
        if (!line || line.trim().startsWith('#')) return
        const idx = line.indexOf('=')
        if (idx === -1) return
        const key = line.slice(0, idx).trim()
        const value = line.slice(idx + 1).trim()
        if (key && value && !process.env[key]) {
          process.env[key] = value
        }
      })
      supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || supabaseUrl
      supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || supabaseAnonKey
    }
  } catch (envError) {
    console.warn('[Supabase] Failed to load .env automatically', envError)
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ❌ Missing environment variables!')
  console.error('[Supabase] URL:', supabaseUrl || 'MISSING')
  console.error('[Supabase] Key:', supabaseAnonKey ? 'PRESENT' : 'MISSING')
  
  // Try to provide more specific error message
  if (Platform.OS !== 'web') {
    console.error('[Supabase] 💡 On mobile, make sure your .env file is properly configured and the app was rebuilt after changes')
  }
  
  throw new Error('Missing Supabase environment variables')
} else {
  console.log('[Supabase] ✅ Environment variables loaded successfully')
}

// Create Supabase client with React Native specific configuration
console.log('[Supabase] Creating client with config:', {
  supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  hasAnonKey: !!supabaseAnonKey,
  platform: Platform.OS
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time events (auction bidding)
    }
  }
})

console.log('[Supabase] ✅ Client created successfully')

// Connection test function for development
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('[Supabase] Testing connection...')
    // Simple connection test - just check if we can make a query
    // Use a publicly readable table under RLS policies
    const { data, error } = await supabase
      .from('handyman_profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('[Supabase] Connection test failed:', error.message)
      return false
    }

    console.log('[Supabase] ✅ Connection successful')
    return true
  } catch (error) {
    console.error('[Supabase] ❌ Connection error:', error)
    return false
  }
}