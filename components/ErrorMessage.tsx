import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface ErrorMessageProps {
  error: string | null;
  style?: any;
}

export function ErrorMessage({ error, style }: ErrorMessageProps) {
  const colorScheme = useColorScheme();

  if (!error) return null;

  // Convert technical error codes to user-friendly messages
  const getFriendlyMessage = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('invalid login credentials') || lowerError.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (lowerError.includes('email not confirmed') || lowerError.includes('email_not_confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    
    if (lowerError.includes('too many requests') || lowerError.includes('429')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    
    if (lowerError.includes('weak password') || lowerError.includes('password')) {
      return 'Password must be at least 6 characters long with a mix of letters and numbers.';
    }
    
    if (lowerError.includes('email') && lowerError.includes('already')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (lowerError.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (lowerError.includes('slot') && lowerError.includes('unavailable')) {
      return 'This time slot is no longer available. Please choose another slot.';
    }
    
    if (lowerError.includes('booking') && lowerError.includes('conflict')) {
      return 'Another customer is booking this slot. An auction may start soon.';
    }
    
    if (lowerError.includes('pgrst116') || lowerError.includes('0 rows') || lowerError.includes('406')) {
      return 'Account setup is in progress. Please wait a moment and try logging in again.';
    }
    
    if (lowerError.includes('user type') || lowerError.includes('profile')) {
      return 'There was an issue with your account setup. Please try logging out and back in.';
    }
    
    // Return original message if no specific mapping found
    return errorMessage;
  };

  return (
    <View style={[styles.container, style]} testID="error-message-container">
      <ThemedText style={[styles.errorText, { color: '#F44336' }]} testID="error-message">
        {getFriendlyMessage(error)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});