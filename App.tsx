import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/contexts/AuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { LanguageProvider } from './src/contexts/LanguageContext'
import { ToastProvider } from './src/contexts/ToastContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { auctionLifecycleService } from './src/services/auction-lifecycle.service'
import { AppNavigator } from './src/navigation/AppNavigator'
import { runConnectionTests } from './src/utils/test-connection'
import { ErrorBoundary } from './src/components/ErrorBoundary'
// import './global.css' // Temporarily disabled to avoid build hanging

export default function App() {
  useEffect(() => {
    console.log('[App] 🚀 App starting...')
    console.log('[App] 📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
    console.log('[App] 🔑 Supabase Key present:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
    
    // Test Supabase connection on app startup
    console.log('[App] 🔍 Testing Supabase connection...')
    runConnectionTests().then((result) => {
      if (result) {
        console.log('[App] ✅ Supabase connection test passed')
      } else {
        console.log('[App] ❌ Supabase connection test failed')
      }
    }).catch((error) => {
      console.log('[App] 💥 Supabase connection test error:', error)
    })
    
    // Start auction lifecycle service
    console.log('[App] 🔄 Starting auction lifecycle service...')
    auctionLifecycleService.start()
    
    // Cleanup function to stop the service when app unmounts
    return () => {
      console.log('[App] 🛑 Stopping auction lifecycle service...')
      auctionLifecycleService.stop()
    }
  }, [])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <NotificationProvider>
                <AppNavigator />
                <StatusBar style="auto" />
              </NotificationProvider>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}