import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/contexts/AuthContext'
import { ThemeProvider } from './src/contexts/ThemeContext'
import { ToastProvider } from './src/contexts/ToastContext'
import { NotificationProvider } from './src/contexts/NotificationContext'
import { auctionLifecycleService } from './src/services/auction-lifecycle.service'
import { AppNavigator } from './src/navigation/AppNavigator'
import { runConnectionTests } from './src/utils/test-connection'
// import './global.css' // Temporarily disabled to avoid build hanging

export default function App() {
  useEffect(() => {
    // Test Supabase connection on app startup
    console.log('🚀 App starting, testing Supabase connection...')
    console.log('📡 Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
    runConnectionTests()
    
    // Start auction lifecycle service
    auctionLifecycleService.start()
    
    // Cleanup function to stop the service when app unmounts
    return () => {
      auctionLifecycleService.stop()
    }
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
