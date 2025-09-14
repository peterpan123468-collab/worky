import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Check if Supabase credentials are properly configured
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
  console.warn('⚠️ Supabase configuration incomplete or missing. Running in offline mode.');
}

// Use different storage for web to avoid window/AsyncStorage issues
const storage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
} : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (url, options = {}) => {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        return response;
      } catch (error) {
        console.warn('🔌 Supabase connection failed, running in offline mode:', error.message);
        // Return a mock response for offline mode
        return new Response(JSON.stringify({ error: 'Offline mode' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    },
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          user_type: 'handyman' | 'customer';
          profile_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          user_type: 'handyman' | 'customer';
          profile_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          user_type?: 'handyman' | 'customer';
          profile_data?: any;
          created_at?: string;
        };
      };
      handyman_profiles: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          hourly_rate: number;
          skills: string[];
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          hourly_rate: number;
          skills: string[];
          location: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          hourly_rate?: number;
          skills?: string[];
          location?: string;
          created_at?: string;
        };
      };
      time_slots: {
        Row: {
          id: string;
          handyman_id: string;
          start_time: string;
          duration: number;
          status: 'available' | 'booked' | 'auction' | 'completed';
          created_at: string;
        };
        Insert: {
          id?: string;
          handyman_id: string;
          start_time: string;
          duration: number;
          status?: 'available' | 'booked' | 'auction' | 'completed';
          created_at?: string;
        };
        Update: {
          id?: string;
          handyman_id?: string;
          start_time?: string;
          duration?: number;
          status?: 'available' | 'booked' | 'auction' | 'completed';
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          slot_id: string;
          customer_id: string;
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          final_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          customer_id: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          final_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slot_id?: string;
          customer_id?: string;
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
          final_price?: number;
          created_at?: string;
        };
      };
    };
  };
}