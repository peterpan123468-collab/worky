import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage, LANGUAGE_OPTIONS, AppLanguage } from '../contexts/LanguageContext'
import { Card, CardContent } from '../components/ui/card'
import { Ionicons } from '@expo/vector-icons'
import { Background } from '../components/Background'
import { glassCard } from '../components/themeStyles'
import { t } from '../utils/i18n'

export function SettingsScreen() {
  const { theme } = useTheme()
  const { language, setLanguage } = useLanguage()

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 24 }}>
          <View style={{ marginBottom: 32 }}>
            <Text style={styles.title}>{t('settings.title', language)}</Text>
            <Text style={styles.subtitle}>{t('settings.subtitle', language)}</Text>
          </View>

          {/* Language Settings Card */}
          <Card style={[styles.card, theme === 'glass' && glassCard]}>
            <CardContent>
              <View style={styles.cardHeader}>
                <Ionicons name="language-outline" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>{t('settings.language.title', language)}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>
                  {t('settings.language.description', language)}
                </Text>
                
                <View style={{ marginTop: 16 }}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.optionButton,
                        language === lang.code && styles.optionButtonSelected
                      ]}
                      onPress={() => setLanguage(lang.code as AppLanguage)}
                    >
                      <Text style={[
                        styles.optionText,
                        language === lang.code && styles.optionTextSelected
                      ]}>
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Theme Settings Card */}
          <Card style={[styles.card, theme === 'glass' && glassCard]}>
            <CardContent>
              <View style={styles.cardHeader}>
                <Ionicons name="color-palette-outline" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>{t('settings.appearance.title', language)}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>
                  {t('settings.appearance.description', language)}
                </Text>
                <Text style={styles.cardHint}>
                  {t('settings.appearance.hint', language)}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Notification Settings Card */}
          <Card style={[styles.card, theme === 'glass' && glassCard]}>
            <CardContent>
              <View style={styles.cardHeader}>
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
                <Text style={styles.cardTitle}>{t('settings.notifications.title', language)}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardDescription}>
                  {t('settings.notifications.description', language)}
                </Text>
                <Text style={styles.cardHint}>
                  {t('settings.notifications.coming_soon', language)}
                </Text>
              </View>
            </CardContent>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  card: {
    marginBottom: 24,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardContent: {
    marginTop: 8,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 24,
  },
  cardHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  optionText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
})