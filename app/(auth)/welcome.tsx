import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Welcome to Worky
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Connect skilled handymen with customers for spontaneous job opportunities
        </ThemedText>
      </View>

      <View style={styles.buttonContainer}>
        {/* Sign In - First Option */}
        <Pressable
          style={[
            styles.button,
            styles.signInButton,
            { 
              backgroundColor: Colors[colorScheme ?? 'light'].tint,
              borderColor: Colors[colorScheme ?? 'light'].tint 
            }
          ]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={[styles.buttonText, { color: '#000', fontWeight: '600' }]}>
            Sign In
          </Text>
          <Text style={[styles.buttonDescription, { color: '#000' }]}>
            Already have an account? Log in here
          </Text>
        </Pressable>

        {/* Sign Up - Second Option */}
        <Pressable
          style={[
            styles.button,
            styles.signUpButton,
            { 
              backgroundColor: 'transparent',
              borderColor: Colors[colorScheme ?? 'light'].tint 
            }
          ]}
          onPress={() => setShowUserTypeSelection(true)}
        >
          <ThemedText 
            type="defaultSemiBold" 
            style={[
              styles.buttonText, 
              { color: Colors[colorScheme ?? 'light'].tint }
            ]}
          >
            Sign Up
          </ThemedText>
          <ThemedText 
            style={[
              styles.buttonDescription, 
              { color: Colors[colorScheme ?? 'light'].tint }
            ]}
          >
            Create a new account as handyman or customer
          </ThemedText>
        </Pressable>
      </View>

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeSelection}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowUserTypeSelection(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <Pressable 
          style={styles.overlay}
          onPress={() => setShowUserTypeSelection(false)}
          accessible={false}
        >
          <Pressable 
            style={[styles.modal, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
            onPress={() => {}}
            accessible={true}
            accessibilityLabel="Choose your account type"
          >
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Choose Your Account Type
            </ThemedText>
            
            <Pressable
              style={[
                styles.modalButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint }
              ]}
              onPress={() => {
                setShowUserTypeSelection(false);
                router.push('/(auth)/register?type=handyman');
              }}
            >
              <Text style={[styles.modalButtonText, { color: '#000', fontWeight: '600' }]}>
                I'm a Handyman
              </Text>
              <Text style={[styles.modalButtonDescription, { color: '#000' }]}>
                List your available time slots and earn money
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault }
              ]}
              onPress={() => {
                setShowUserTypeSelection(false);
                router.push('/(auth)/register?type=customer');
              }}
            >
              <Text style={[styles.modalButtonText, { color: '#fff', fontWeight: '600' }]}>
                I'm a Customer
              </Text>
              <Text style={[styles.modalButtonDescription, { color: '#fff' }]}>
                Find immediate help for urgent tasks
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowUserTypeSelection(false)}
            >
              <ThemedText style={[styles.cancelButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Cancel
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    gap: 20,
    marginBottom: 40,
  },
  button: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  signInButton: {
    borderWidth: 2,
  },
  signUpButton: {
    borderWidth: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtonText: {
    fontSize: 16,
    marginBottom: 6,
  },
  modalButtonDescription: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 18,
    marginBottom: 8,
  },
  buttonDescription: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
});