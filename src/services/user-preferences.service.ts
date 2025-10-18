import { supabase } from '../lib/supabase'
import { AppLanguage } from '../contexts/LanguageContext'

export interface UserPreferences {
  language: AppLanguage
}

/**
 * Get user preferences from Supabase
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    // First try to get handyman profile
    const { data: handymanProfile, error: handymanError } = await supabase
      .from('handyman_profiles')
      .select('language')
      .eq('user_id', userId)
      .single()

    if (handymanProfile && !handymanError) {
      return {
        language: (handymanProfile.language as AppLanguage) || 'en'
      }
    }

    // If not a handyman, try customer profile
    const { data: customerProfile, error: customerError } = await supabase
      .from('customer_profiles')
      .select('language')
      .eq('user_id', userId)
      .single()

    if (customerProfile && !customerError) {
      return {
        language: (customerProfile.language as AppLanguage) || 'en'
      }
    }

    // Return default preferences if no profile found
    return {
      language: 'en'
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return null
  }
}

/**
 * Update user language preference
 */
export async function updateUserLanguage(userId: string, userType: 'handyman' | 'customer', language: AppLanguage): Promise<boolean> {
  try {
    if (userType === 'handyman') {
      const { error } = await supabase
        .from('handyman_profiles')
        .update({ language })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating handyman language preference:', error)
        return false
      }
    } else {
      const { error } = await supabase
        .from('customer_profiles')
        .update({ language })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating customer language preference:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error updating user language preference:', error)
    return false
  }
}