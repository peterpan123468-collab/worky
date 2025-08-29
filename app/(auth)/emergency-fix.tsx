import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';

export default function EmergencyFixScreen() {
  const { signOut } = useAuth();

  const handleClearAuth = () => {
    Alert.alert(
      'Clear Authentication',
      'This will clear all authentication data and restart the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Restart',
          style: 'destructive',
          onPress: () => {
            // Clear all storage
            if (typeof localStorage !== 'undefined') {
              localStorage.clear();
            }
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.clear();
            }
            // Reload the page
            window.location.reload();
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Sign out error:', error);
      handleClearAuth();
    }
  };

  const handleGoToRegion = () => {
    router.replace('/(auth)/region-selection');
  };

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Emergency Fix
      </ThemedText>
      
      <ThemedText style={styles.subtitle}>
        Use these options to resolve authentication issues
      </ThemedText>

      <Pressable style={styles.button} onPress={handleGoToRegion}>
        <Text style={styles.buttonText}>Go to Region Selection</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleGoToLogin}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.dangerButton]} onPress={handleClearAuth}>
        <Text style={styles.buttonText}>Clear All Data & Restart</Text>
      </Pressable>
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 250,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
