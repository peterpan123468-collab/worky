import React from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { UserType } from '../types/database.types'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Background } from '../components/Background'
import { glassCard } from '../components/themeStyles'
import Ionicons from '@expo/vector-icons/Ionicons'
import { t } from '../utils/i18n'

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>

const { width, height } = Dimensions.get('window')

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenNavigationProp>()
  const { theme, setTheme } = useTheme()
  const { language: appLanguage } = useLanguage()
  const { language } = useLanguage()

  const handleSelectUserType = (userType: UserType) => {
    navigation.navigate('Auth', { userType })
  }

  return (
    <Background style={styles.background}>
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <View style={[styles.card, theme === 'glass' && glassCard]}>
            {/* Logo/Brand */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>{t('welcome.title', appLanguage)}</Text>
              <Text style={styles.subtitleText}>
                {t('welcome.subtitle', appLanguage)}
              </Text>
            </View>

            {/* User Type Selection */}
            <View style={styles.selectionContainer}>
              <Text style={styles.selectionTitle}>
                {t('welcome.choose_role', appLanguage)}
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={() => handleSelectUserType('handyman')}
                  style={styles.userTypeButton}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="construct-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>{t('welcome.i_am_a_handyman', appLanguage)}</Text>
                      <Text style={styles.buttonSubtitle}>{t('welcome.offer_your_services', appLanguage)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleSelectUserType('customer')}
                  style={styles.userTypeButton}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="home-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>{t('welcome.i_need_help', appLanguage)}</Text>
                      <Text style={styles.buttonSubtitle}>{t('welcome.find_skilled_handymen', appLanguage)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={[styles.testButton, { alignSelf: 'center', marginBottom: 16 }]}
                onPress={() => navigation.navigate('Settings')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="settings-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.testButtonText}>{t('welcome.app_settings')}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.footerText}>
                {t('welcome.terms', appLanguage)}
              </Text>
              <View style={styles.themeRow}>
                <Text style={styles.footerText}>{t('welcome.theme')}:</Text>
                <View style={styles.themeButtons}>
                  <TouchableOpacity onPress={() => setTheme('gradient')} style={[styles.themeButton, theme === 'gradient' && styles.themeButtonActive]}>
                    <Text style={styles.themeButtonText}>{t('welcome.gradient')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTheme('mascot')} style={[styles.themeButton, theme === 'mascot' && styles.themeButtonActive]}>
                    <Text style={styles.themeButtonText}>{t('welcome.mascot')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTheme('glass')} style={[styles.themeButton, theme === 'glass' && styles.themeButtonActive]}>
                    <Text style={styles.themeButtonText}>{t('welcome.glass')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => navigation.navigate('TestAuth')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="flask-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.testButtonText}>{t('welcome.test_auth')}</Text>
                </View>
              </TouchableOpacity>
              
              {/* Debug Button */}
              <TouchableOpacity
                style={[styles.testButton, { marginTop: 8 }]}
                onPress={() => navigation.navigate('Debug')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="bug-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.testButtonText}>{t('welcome.debug_connection')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testButton, { marginTop: 8 }]}
                onPress={() => navigation.navigate('SupabaseTest')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cloud-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.testButtonText}>{t('welcome.test_supabase')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.testButton, { marginTop: 8 }]}
                onPress={() => navigation.navigate('MobileTest')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="phone-portrait-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.testButtonText}>{t('welcome.mobile_test')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontSize: 16,
  },
  selectionContainer: {
    marginBottom: 32,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  userTypeButton: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    height: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonIcon: {
    marginTop: 2,
  },
  buttonTextContainer: {
    alignItems: 'flex-start',
  },
  buttonTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  buttonSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  footerContainer: {
    textAlign: 'center',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  themeRow: {
    marginTop: 12,
    gap: 8,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  themeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  themeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  themeButtonText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    textAlign: 'center',
  },
  testButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  testButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
})
