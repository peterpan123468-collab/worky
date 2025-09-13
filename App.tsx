import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/contexts/AuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { ToastProvider } from './src/contexts/ToastContext'
import { AppNavigator } from './src/navigation/AppNavigator'
import { runConnectionTests } from './src/utils/test-connection'
// import './global.css' // Temporarily disabled to avoid build hanging

export default function App() {
  useEffect(() => {
    // Test Supabase connection on app startup
    console.log('🚀 App starting, testing Supabase connection...')
    console.log('📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
    runConnectionTests()
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
