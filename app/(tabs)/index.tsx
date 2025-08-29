import { useAuth } from '@/contexts/AuthContext';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { session, userType, hasSelectedRegion, hasCompletedWorkSetup, isLoading } = useAuth();

  // Check if user should be here - but don't create navigation loops
  useEffect(() => {
    console.log('🏠 TABS INDEX - Auth check (no auto-redirect):', {
      session: !!session,
      userType,
      hasSelectedRegion,
      hasCompletedWorkSetup,
      isLoading
    });
  }, [session, userType, hasSelectedRegion, hasCompletedWorkSetup, isLoading]);

  // If user shouldn't be here, show message instead of redirecting
  if (!isLoading && (!session || !userType || !hasSelectedRegion || (userType === 'handyman' && !hasCompletedWorkSetup))) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Authentication Required</ThemedText>
        <ThemedText style={styles.subtitle}>Please complete your profile setup first.</ThemedText>
        <Pressable 
          style={styles.redirectButton}
          onPress={() => {
            console.log('🔄 Manual redirect to main auth flow');
            router.replace('/');
          }}
        >
          <ThemedText style={styles.buttonText}>Go to Profile Setup</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // User is properly authenticated and set up - show main content
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Worky!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">You're all set up!</ThemedText>
        <ThemedText>
          Your profile is complete and you can now use all Worky features.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Profile Status</ThemedText>
        <ThemedText>
          Account Type: {userType === 'customer' ? 'Customer' : 'Handyman'}{"\n"}
          Region: {hasSelectedRegion ? 'Selected' : 'Not Selected'}{"\n"}
          {userType === 'handyman' && `Setup: ${hasCompletedWorkSetup ? 'Complete' : 'Incomplete'}`}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  redirectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

