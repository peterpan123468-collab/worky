import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

// Suppress specific React Native Web deprecation warnings
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  // Suppress console.warn messages
  console.warn = function(message, ...args) {
    // Suppress specific deprecation warnings that we can't fix (from expo-router and other deps)
    if (
      typeof message === 'string' && (
        message.includes('"shadow*" style props are deprecated. Use "boxShadow"') ||
        message.includes('props.pointerEvents is deprecated. Use style.pointerEvents') ||
        message.includes('shadow*') && message.includes('deprecated')
      )
    ) {
      return; // Skip these warnings
    }
    // Call original warn for other messages
    originalWarn.apply(console, [message, ...args]);
  };
  
  // Also suppress console.error for these specific warnings
  console.error = function(message, ...args) {
    if (
      typeof message === 'string' && (
        message.includes('"shadow*" style props are deprecated. Use "boxShadow"') ||
        message.includes('props.pointerEvents is deprecated. Use style.pointerEvents')
      )
    ) {
      return; // Skip these warnings
    }
    // Call original error for other messages
    originalError.apply(console, [message, ...args]);
  };
}

export class DebugUtils {
  /**
   * Check if a user record exists in the users table
   */
  static async checkUserRecord(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('❌ User record not found:', error);
        return { exists: false, error };
      } else {
        console.log('✅ User record found:', data);
        return { exists: true, data };
      }
    } catch (error) {
      console.error('Error checking user record:', error);
      return { exists: false, error };
    }
  }

  /**
   * Create a missing user record
   */
  static async createUserRecord(userId: string, email: string, userType: 'handyman' | 'customer') {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          user_type: userType
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create user record:', error);
        return { success: false, error };
      } else {
        console.log('✅ User record created:', data);
        return { success: true, data };
      }
    } catch (error) {
      console.error('Error creating user record:', error);
      return { success: false, error };
    }
  }

  /**
   * Fix missing user record for current authenticated user
   */
  static async fixCurrentUserRecord(userType: 'handyman' | 'customer') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user found');
        return { success: false, error: 'No authenticated user' };
      }

      console.log('🔍 Checking user record for:', user.id);
      
      const { exists } = await this.checkUserRecord(user.id);
      
      if (!exists) {
        console.log('🔧 Creating missing user record...');
        return await this.createUserRecord(user.id, user.email!, userType);
      } else {
        console.log('✅ User record already exists');
        return { success: true, message: 'User record already exists' };
      }
    } catch (error) {
      console.error('Error fixing user record:', error);
      return { success: false, error };
    }
  }

  /**
   * Emergency fix for the current login issue
   */
  static async emergencyUserFix() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user found');
        if (typeof window !== 'undefined') {
          Alert.alert('Error', 'No authenticated user found. Please try logging in again.');
        }
        return { success: false, error: 'No authenticated user' };
      }

      console.log('🚨 Emergency fix for user:', user.id);
      
      // Try to create user record with default 'customer' type
      const { success, error } = await this.createUserRecord(user.id, user.email!, 'customer');
      
      if (success) {
        if (typeof window !== 'undefined') {
          Alert.alert(
            'Account Fixed!', 
            'Your account has been set up as a Customer. You can change this later if needed. Please refresh the page.',
            [{ text: 'OK', onPress: () => window.location.reload() }]
          );
        }
        return { success: true, message: 'User record created successfully' };
      } else {
        if (typeof window !== 'undefined') {
          Alert.alert('Error', 'Failed to fix account. Please contact support.');
        }
        return { success: false, error };
      }
    } catch (error) {
      console.error('Error in emergency fix:', error);
      return { success: false, error };
    }
  }

  /**
   * Quick user type updater
   */
  static async updateUserType(userType: 'handyman' | 'customer') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      const { data, error } = await supabase
        .from('users')
        .update({ user_type: userType })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update user type:', error);
        return { success: false, error };
      } else {
        console.log('✅ User type updated:', data);
        if (typeof window !== 'undefined') {
          Alert.alert('Success', `User type updated to ${userType}. Please refresh the page.`);
        }
        return { success: true, data };
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all auth users without corresponding user records
   */
  static async findOrphanedAuthUsers() {
    try {
      // This would require admin access to auth.users table
      // For now, we'll just return a helpful message
      console.log('🔍 To check for orphaned auth users, run this SQL in Supabase:');
      console.log(`
        SELECT au.id, au.email, au.created_at
        FROM auth.users au
        LEFT JOIN public.users pu ON au.id = pu.id
        WHERE pu.id IS NULL;
      `);
      
      return { 
        success: true, 
        message: 'Check Supabase SQL editor for orphaned users query' 
      };
    } catch (error) {
      console.error('Error finding orphaned users:', error);
      return { success: false, error };
    }
  }
}

// Helper function to expose debug utilities to the global scope for testing
declare global {
  interface Window {
    debugUtils: typeof DebugUtils;
  }
}

if (typeof window !== 'undefined') {
  window.debugUtils = DebugUtils;
}