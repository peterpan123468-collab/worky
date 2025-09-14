import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { session, userType, hasSelectedRegion, hasCompletedWorkSetup, isLoading, error } = useAuth();

  useEffect(() => {
    console.log('🔍 Auth State Check:', { 
      session: !!session, 
      userType, 
      hasSelectedRegion, 
      hasCompletedWorkSetup, 
      isLoading,
      error
    });
    
    if (isLoading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

    // If there's a network error, redirect to welcome to allow offline usage
    if (error && (error.includes('Network') || error.includes('connect'))) {
      console.log('🌐 Network error detected - redirecting to welcome for offline mode');
      router.replace('/(auth)/welcome');
      return;
    }

    if (!session) {
      console.log('🚫 No session - redirecting to welcome');
      router.replace('/(auth)/welcome');
      return;
    }

    if (!userType) {
      console.log('⚠️ No user type - redirecting to emergency fix');
      router.replace('/(auth)/emergency-fix');
      return;
    }

    if (!hasSelectedRegion) {
      console.log('🌍 No region selected - redirecting to region selection');
      router.replace('/(auth)/region-selection');
      return;
    }

    if (userType === 'handyman' && !hasCompletedWorkSetup) {
      console.log('🔧 Handyman needs work setup - redirecting to work type selection');
      router.replace('/(auth)/work-type-selection');
      return;
    }

    // All setup complete - go to main app
    console.log('✅ Setup complete - redirecting to main app');
    router.replace('/(tabs)');
  }, [session, userType, hasSelectedRegion, hasCompletedWorkSetup, isLoading, error]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading Worky...</ThemedText>
        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText>Redirecting...</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
});