import { ErrorMessage } from '@/components/ErrorMessage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, error, clearError, isOfflineMode } = useAuth();
  const colorScheme = useColorScheme();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) clearError(); // Clear error when user starts typing
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (error) clearError(); // Clear error when user starts typing
  };

  const handleLogin = async () => {
    console.log('🔄 Login attempt started');
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('📧 Attempting login with email:', email);
    setIsLoading(true);
    
    try {
      const result = await signIn(email, password);
      console.log('🔐 Sign-in result:', result);
      
      if (result.error) {
        console.log('❌ Login error:', result.error.message);
        // Error will be handled by AuthContext and displayed via ErrorMessage
      } else {
        console.log('✅ Login successful, navigating to app root for redirect');
        // Navigate to root to trigger proper redirect logic (including region selection)
        router.replace('/');
      }
    } catch (error) {
      console.log('💥 Unexpected error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
    
    // Navigation will be handled by the auth context
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        {isOfflineMode && (
          <View style={styles.offlineMode}>
            <ThemedText style={styles.offlineModeText}>
              🔌 Offline Mode - Demo Authentication
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
              onChangeText={handleEmailChange}
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
              onChangeText={handlePasswordChange}
              placeholder="Enter your password"
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
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: '#000000', fontWeight: '600' }]}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Don't have an account?{' '}
          </ThemedText>
          <Pressable onPress={() => router.push('/(auth)/welcome')}>
            <ThemedText style={[styles.footerLink, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Sign Up
            </ThemedText>
          </Pressable>
        </View>

        {error && error.includes('setup') && (
          <View style={styles.emergencySection}>
            <ThemedText style={styles.emergencyText}>
              Having account issues?
            </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/emergency-fix')}>
              <ThemedText style={[styles.emergencyLink, { color: '#FF6B35' }]}>
                🛠️ Emergency Fix
              </ThemedText>
            </Pressable>
          </View>
        )}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
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
  emergencySection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
  },
  emergencyText: {
    fontSize: 14,
    marginRight: 8,
  },
  emergencyLink: {
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