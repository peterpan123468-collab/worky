import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type AppTheme = 'gradient' | 'mascot' | 'glass'

interface ThemeContextType {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = '@worky_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppTheme>('gradient')
  const [isLoading, setIsLoading] = useState(true)

  // Load theme from storage on app start
  useEffect(() => {
    console.log('[ThemeProvider] Loading theme...')
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        console.log('[ThemeProvider] Saved theme:', savedTheme)
        if (savedTheme && ['gradient', 'mascot', 'glass'].includes(savedTheme)) {
          setTheme(savedTheme as AppTheme)
        }
      } catch (error) {
        console.log('[ThemeProvider] Error loading theme:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTheme()
  }, [])

  // Save theme to storage whenever it changes
  const updateTheme = async (newTheme: AppTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.log('[ThemeProvider] Error saving theme:', error)
      // Still update the theme in memory even if storage fails
      setTheme(newTheme)
    }
  }

  // Show loading indicator instead of returning null
  if (isLoading) {
    console.log('[ThemeProvider] Still loading theme...')
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <ActivityIndicator size="large" color="#171717" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading theme...</Text>
      </View>
    )
  }

  console.log('[ThemeProvider] Theme loaded:', theme)
  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}