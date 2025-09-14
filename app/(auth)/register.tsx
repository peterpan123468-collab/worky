import { ErrorMessage } from '@/components/ErrorMessage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const { type } = useLocalSearchParams<{ type: 'handyman' | 'customer' }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, error, clearError, isOfflineMode } = useAuth();
  const colorScheme = useColorScheme();

  const userType = type || 'customer';

  const handleFieldChange = (setter: (value: string) => void) => (text: string) => {
    setter(text);
    if (error) clearError(); // Clear error when user starts typing
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, userType);
    setIsLoading(false);

    if (error) {
      // Error will be handled by AuthContext and displayed via ErrorMessage
      console.log('Registration error:', error.message);
    } else {
      if (isOfflineMode) {
        // In offline mode, navigate directly to region selection
        Alert.alert(
          'Registration Successful',
          'Welcome! Let\'s set up your profile.',
          [{ text: 'Continue', onPress: () => router.replace('/') }]
        );
      } else {
        Alert.alert(
          'Registration Successful',
          'Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Create {userType === 'handyman' ? 'Handyman' : 'Customer'} Account
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {userType === 'handyman' 
                ? 'Join our platform to offer your services and earn money'
                : 'Find skilled handymen for your urgent tasks'
              }
            </ThemedText>
          </View>

          {isOfflineMode && (
            <View style={styles.offlineMode}>
              <ThemedText style={styles.offlineModeText}>
                🔌 Offline Mode - Demo Registration
              </ThemedText>
              <ThemedText style={styles.offlineModeSubtext}>
                Use any email and password (6+ characters) to test the app
              </ThemedText>
            </View>
          )}

          <ErrorMessage error={error} />

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={email}
                onChangeText={handleFieldChange(setEmail)}
                placeholder="Enter your email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={password}
                onChangeText={handleFieldChange(setPassword)}
                placeholder="Create a password (min. 6 characters)"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={confirmPassword}
                onChangeText={handleFieldChange(setConfirmPassword)}
                placeholder="Confirm your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Pressable
              style={[
                styles.button,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: '#000000', fontWeight: '600' }]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Already have an account?{' '}
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <ThemedText style={[styles.footerLink, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Sign In
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  offlineMode: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  offlineModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
  },
  offlineModeSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});