import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
// UI components not used in this screen after styling restoration
import { UserType } from '../types/database.types'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Background } from '../components/Background'
import { glassCard } from '../components/themeStyles'
import Ionicons from '@expo/vector-icons/Ionicons'

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>
type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>

export function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>()
  const route = useRoute<AuthScreenRouteProp>()
  const { signUp, signIn, error, clearError } = useAuth()
  const { theme } = useTheme()
  const { userType } = route.params

  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signin')
  const [isLoading, setIsLoading] = useState(false)

  // Basic form fields
  const [email, setEmail] = useState('atemndobs@gmail.com')
  const [password, setPassword] = useState('Atem1234')

  // Signup additional fields
  const [businessName, setBusinessName] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [region, setRegion] = useState('Zurich')
  const [skills, setSkills] = useState('')
  const [phone, setPhone] = useState('')

  // Clear error when switching tabs
  useEffect(() => {
    clearError()
  }, [activeTab, clearError])

  const handleSubmit = async () => {
    setIsLoading(true)
    console.log(`🔐 Starting ${activeTab} flow for ${userType} with email: ${email}`)

    try {
      // Basic validation
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in email and password')
        return
      }

      if (activeTab === 'signup' && userType === 'handyman' && (!businessName || !hourlyRate)) {
        Alert.alert('Error', 'Please fill in business details')
        return
      }

      let result

      if (activeTab === 'signin') {
        // REAL LOGIN - Use Supabase authentication
        console.log('🔐 Attempting real login...')
        result = await signIn(email, password)
      } else {
        // REAL SIGNUP - Use Supabase authentication
        console.log('📝 Attempting real signup...')

        const signUpData = {
          email,
          password,
          userType,
          ...(userType === 'handyman' ? {
            businessName,
            hourlyRate: parseFloat(hourlyRate) || 50,
            region: region || 'Zurich',
            skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
            phone
          } : {})
        }

        result = await signUp(signUpData)
      }

      if (result.error) {
        console.error('❌ Auth failed:', result.error)
        Alert.alert('Authentication Failed', result.error)
        return
      }

      console.log('✅ Auth successful!')

      // Navigation will be handled automatically by AuthContext state change
      // But we can still navigate manually for immediate feedback
      if (userType === 'handyman') {
        navigation.navigate('HandymanDashboard')
      } else {
        navigation.navigate('CustomerDashboard')
      }

    } catch (error) {
      console.error('💥 Auth error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      Alert.alert('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const userTypeTitle = userType === 'handyman' ? 'Handyman' : 'Customer'
  const userIconName = userType === 'handyman' ? 'construct-outline' : 'home-outline'
  const isLogin = activeTab === 'signin'

  return (
    <Background style={styles.background}>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.cardContainer}>
            <View style={[styles.card, theme === 'glass' && glassCard]}>
              {/* Header with tabs and close button */}
              <View style={styles.header}>
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('signup')}
                    style={[
                      styles.tab,
                      activeTab === 'signup' && styles.activeTab
                    ]}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === 'signup' && styles.activeTabText
                    ]}>
                      Sign up
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('signin')}
                    style={[
                      styles.tab,
                      activeTab === 'signin' && styles.activeTab
                    ]}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === 'signin' && styles.activeTabText
                    ]}>
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                  <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.8)" />
                </TouchableOpacity>
              </View>

              {/* User Type Header / Title */}
              {isLogin && (
                <Text style={styles.title}>
                  Welcome back
                </Text>
              )}
              {!isLogin && (
                <View style={styles.userTypeHeader}>
                  <Ionicons name={userIconName} size={28} color="#ffffff" style={{ marginBottom: 8 }} />
                  <Text style={styles.userTypeTitle}>Join as {userTypeTitle}</Text>
                </View>
              )}

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{String(error)}</Text>
                  <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Form */}
              <View style={styles.form}>
                {/* Email */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="atemndobs@gmail.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Atem1234"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry
                  />
                </View>

                {/* Handyman additional fields for signup */}
                {!isLogin && userType === 'handyman' && (
                  <>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={businessName}
                        onChangeText={setBusinessName}
                        placeholder="Business Name *"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        placeholder="Hourly Rate (CHF) *"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={region}
                        onChangeText={setRegion}
                        placeholder="Region"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={skills}
                        onChangeText={setSkills}
                        placeholder="Skills (comma separated)"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={styles.submitButton}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? (isLogin ? 'Signing in...' : 'Signing up...') : (isLogin ? 'Sign in' : 'Create an account')}
                  </Text>
                </TouchableOpacity>

                {/* Test credentials moved to TestAuthScreen */}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
   scrollView: {
     flex: 1,
   },
  scrollContent: {
    flexGrow: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  userTypeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#fecaca',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    padding: 4,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  // test credentials info styles removed; shown only in TestAuthScreen
})
