import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface CustomerProfile {
  full_name: string;
  phone: string;
  location: string;
  preferences: string;
}

export default function CustomerProfile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile>({
    full_name: '',
    phone: '',
    location: '',
    preferences: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      } else if (data?.profile_data) {
        const profileData = data.profile_data;
        setProfile({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          preferences: profileData.preferences || '',
        });
        setHasExistingProfile(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profile.full_name) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          profile_data: {
            full_name: profile.full_name,
            phone: profile.phone,
            location: profile.location,
            preferences: profile.preferences,
          }
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      } else {
        Alert.alert('Success', 'Profile saved successfully!');
        setHasExistingProfile(true);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' },
      ]
    );
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
              My Profile
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Manage your account information
            </ThemedText>
            <View style={styles.emailContainer}>
              <ThemedText style={styles.emailLabel}>Email:</ThemedText>
              <ThemedText style={styles.emailText}>{user?.email}</ThemedText>
            </View>
            <Pressable onPress={handleSignOut} style={styles.signOutButton}>
              <ThemedText style={[styles.signOutText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Sign Out
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Full Name *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Phone Number</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Location</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={profile.location}
                onChangeText={(text) => setProfile({ ...profile, location: text })}
                placeholder="e.g., Downtown Seattle, WA"
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Preferences & Notes</ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].background,
                    borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                    color: Colors[colorScheme ?? 'light'].text,
                  }
                ]}
                value={profile.preferences}
                onChangeText={(text) => setProfile({ ...profile, preferences: text })}
                placeholder="Any specific preferences, requirements, or notes for handymen..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <Pressable
              style={[
                styles.saveButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : hasExistingProfile ? 'Update Profile' : 'Save Profile'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.infoSection}>
            <ThemedText type="subtitle" style={styles.infoTitle}>
              About Worky
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Find handymen with immediate availability
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Book slots instantly or participate in auctions
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Perfect for urgent tasks and last-minute needs
            </ThemedText>
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
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emailText: {
    fontSize: 14,
    opacity: 0.8,
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 20,
    marginBottom: 30,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
});