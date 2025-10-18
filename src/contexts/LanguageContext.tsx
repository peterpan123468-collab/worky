import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getUserPreferences, updateUserLanguage } from '../services/user-preferences.service'
import { useAuth } from './AuthContext'

export type AppLanguage = 'en' | 'de' | 'fr' | 'it'

interface LanguageContextType {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  loading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = '@worky_language'

// Language names in their respective languages
export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' }
]

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>('en')
  const [loading, setLoading] = useState(true)
  const { user, userType } = useAuth()

  // Load language from storage on app start
  useEffect(() => {
    console.log('[LanguageProvider] Loading language...')
    const loadLanguage = async () => {
      try {
        // If user is authenticated, load their preference from Supabase
        if (user?.id && userType) {
          console.log('[LanguageProvider] Loading user language preference...')
          const preferences = await getUserPreferences(user.id)
          if (preferences) {
            setLanguage(preferences.language)
            // Also save to local storage as fallback
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, preferences.language)
            return
          }
        }
        
        // Otherwise, load from local storage
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
        console.log('[LanguageProvider] Saved language:', savedLanguage)
        if (savedLanguage && ['en', 'de', 'fr', 'it'].includes(savedLanguage)) {
          setLanguage(savedLanguage as AppLanguage)
        }
      } catch (error) {
        console.log('[LanguageProvider] Error loading language:', error)
      } finally {
        setLoading(false)
      }
    }
    loadLanguage()
  }, [user?.id, userType])

  // Save language to storage and Supabase whenever it changes
  const updateLanguage = async (newLanguage: AppLanguage) => {
    try {
      // Save to local storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
      
      // If user is authenticated, also save to Supabase
      if (user?.id && userType) {
        await updateUserLanguage(user.id, userType, newLanguage)
      }
      
      setLanguage(newLanguage)
    } catch (error) {
      console.log('[LanguageProvider] Error saving language:', error)
      // Still update the language in memory even if storage fails
      setLanguage(newLanguage)
    }
  }

  console.log('[LanguageProvider] Language loaded:', language)
  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, loading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}