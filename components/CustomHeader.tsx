import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface CustomHeaderProps {
  title?: string;
}

export function CustomHeader({ title }: CustomHeaderProps) {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
  ];

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageModal(false);
    // TODO: Implement actual language switching logic here
    console.log('Language selected:', language);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate directly to login screen after successful sign out
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={[
      styles.headerContainer, 
      { 
        backgroundColor: Colors[colorScheme ?? 'light'].background,
        borderBottomColor: Colors[colorScheme ?? 'light'].tabIconDefault,
      }
    ]}>
      <View style={styles.headerContent}>
        {title && (
          <Text style={[
            styles.headerTitle, 
            { color: Colors[colorScheme ?? 'light'].text }
          ]}>
            {title}
          </Text>
        )}
        <View style={styles.rightSection}>
          <Pressable
            style={[
              styles.languageButton,
              { borderColor: Colors[colorScheme ?? 'light'].tabIconDefault }
            ]}
            onPress={() => setShowLanguageModal(true)}
          >
            <IconSymbol 
              name="globe" 
              size={14} 
              color={Colors[colorScheme ?? 'light'].text} 
            />
            <Text style={[
              styles.languageText,
              { color: Colors[colorScheme ?? 'light'].text }
            ]}>
              {selectedLanguage.slice(0, 2).toUpperCase()}
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.signOutButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint }
            ]}
            onPress={handleSignOut}
          >
            <IconSymbol 
              name="rectangle.portrait.and.arrow.right" 
              size={16} 
              color="#000" 
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowLanguageModal(false)}
          accessible={false}
        >
          <Pressable 
            style={[
              styles.languageModal, 
              { backgroundColor: Colors[colorScheme ?? 'light'].background }
            ]}
            onPress={() => {}}
            accessible={true}
            accessibilityLabel="Select language"
          >
            <Text style={[
              styles.modalTitle,
              { color: Colors[colorScheme ?? 'light'].text }
            ]}>
              Choose Language
            </Text>
            
            {languages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: selectedLanguage === language.name 
                      ? Colors[colorScheme ?? 'light'].tint 
                      : 'transparent',
                  }
                ]}
                onPress={() => handleLanguageSelect(language.name)}
              >
                <Text style={[
                  styles.languageOptionText,
                  {
                    color: selectedLanguage === language.name 
                      ? '#000' 
                      : Colors[colorScheme ?? 'light'].text
                  }
                ]}>
                  {language.name}
                </Text>
              </Pressable>
            ))}
            
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={[
                styles.cancelButtonText,
                { color: Colors[colorScheme ?? 'light'].tint }
              ]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 44 : 20, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    minWidth: 50,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
  },
  signOutText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  languageModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  languageOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});