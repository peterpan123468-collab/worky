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
import { useAuth } from '../contexts/AuthContext'
import { UserType } from '../types/database.types'

export type RootStackParamList = {
  Welcome: undefined
  Auth: { userType: UserType }
  HandymanDashboard: undefined
  CustomerDashboard: undefined
  TestAuth: undefined
  CreateAuction: undefined
  BrowseAuctions: undefined
  AuctionDetail: { id: string }
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

export function AppNavigator() {
  const { isAuthenticated, isLoading, userType } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? (userType === 'handyman' ? 'HandymanDashboard' : 'CustomerDashboard') : 'Welcome'}
        screenOptions={{
          headerShown: false,
          // Ensure screen containers don't force a white background
          // so per-screen backgrounds (like Auth glass) are visible
          contentStyle: { backgroundColor: 'transparent' },
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
                headerBackTitleVisible: false,
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
                headerBackTitleVisible: false,
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
                headerBackTitleVisible: false,
              }}
            />
          </>
        )}
        <Stack.Screen
          name="TestAuth"
          component={TestAuthScreen}
          options={{ headerShown: true, title: 'Auth Testing' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
