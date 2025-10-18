import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { View, Text, ActivityIndicator } from 'react-native'
import { WelcomeScreen } from '../screens/WelcomeScreen'
import { AuthScreen } from '../screens/AuthScreen'
import { HandymanDashboard } from '../screens/HandymanDashboard'
import { CustomerDashboard } from '../screens/CustomerDashboard'
import { TestAuthScreen } from '../screens/TestAuthScreen'
import { CreateAuction } from '../screens/CreateAuction'
import { BrowseAuctions } from '../screens/BrowseAuctions'
import { AuctionDetail } from '../screens/AuctionDetail'
import { QRCodeDemo } from '../screens/QRCodeDemo'
import { BookingsScreen } from '../screens/BookingsScreen'
import { CreateBookingScreen } from '../screens/CreateBookingScreen'
import SupabaseTestScreen from '../screens/SupabaseTestScreen'
import DebugScreen from '../screens/DebugScreen'
import TestScreen from '../screens/TestScreen'
import MobileTestScreen from '../screens/MobileTestScreen'
import { useAuth } from '../contexts/AuthContext'
import { UserType } from '../types/database.types'
import CalendarScreen from '../screens/CalendarScreen'
import { AllAuctions } from '../screens/AllAuctions'
import { SettingsScreen } from '../screens/SettingsScreen'

export type RootStackParamList = {
  Welcome: undefined
  Auth: { userType: UserType }
  HandymanDashboard: undefined
  CustomerDashboard: undefined
  TestAuth: undefined
  CreateAuction: undefined
  BrowseAuctions: undefined
  AuctionDetail: { id: string }
  QRCodeDemo: undefined
  Bookings: undefined
  CreateBooking: undefined
  SupabaseTest: undefined
  Debug: undefined
  Test: undefined
  MobileTest: undefined
  Calendar: undefined
  AllAuctions: undefined
  Settings: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <ActivityIndicator size="large" color="#171717" />
      <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Connecting to Supabase...</Text>
    </View>
  )
}

export default AppNavigator

export function AppNavigator() {
  const { isAuthenticated, isLoading, userType } = useAuth()

  // Normal navigation flow
  console.log('[AppNavigator] Render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading, 'userType:', userType)

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? (userType === 'handyman' ? 'HandymanDashboard' : 'CustomerDashboard') : 'Welcome'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="HandymanDashboard" component={HandymanDashboard} />
            <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
            <Stack.Screen
              name="CreateAuction"
              component={CreateAuction}
              options={{
                headerShown: true,
                title: 'Create Auction',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="BrowseAuctions"
              component={BrowseAuctions}
              options={{
                headerShown: true,
                title: 'Auctions',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="AuctionDetail"
              component={AuctionDetail}
              options={{
                headerShown: true,
                title: 'Auction',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="QRCodeDemo"
              component={QRCodeDemo}
              options={{
                headerShown: true,
                title: 'QR Code Generator',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="AllAuctions"
              component={AllAuctions}
              options={{
                headerShown: true,
                title: 'All Auctions',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Bookings"
              component={BookingsScreen}
              options={{
                headerShown: true,
                title: 'Bookings',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="CreateBooking"
              component={CreateBookingScreen}
              options={{
                headerShown: true,
                title: 'Book Appointment',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Calendar"
              component={CalendarScreen}
              options={{
                headerShown: true,
                title: 'Calendar',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { color: '#ffffff' },
                headerTintColor: '#ffffff',
                headerShadowVisible: false,
              }}
            />
          </>
        )}
        <Stack.Screen
          name="TestAuth"
          component={TestAuthScreen}
          options={{ headerShown: true, title: 'Auth Testing' }}
        />
        <Stack.Screen
          name="SupabaseTest"
          component={SupabaseTestScreen}
          options={{ headerShown: true, title: 'Supabase Test' }}
        />
        <Stack.Screen
          name="Debug"
          component={DebugScreen}
          options={{ headerShown: true, title: 'Debug' }}
        />
        <Stack.Screen
          name="Test"
          component={TestScreen}
          options={{ headerShown: true, title: 'Test' }}
        />
        <Stack.Screen
          name="MobileTest"
          component={MobileTestScreen}
          options={{ headerShown: true, title: 'Mobile Test' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}