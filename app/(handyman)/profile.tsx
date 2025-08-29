import { CustomHeader } from '@/components/CustomHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

interface HandymanProfile {
  id: string;
  user_id: string;
  business_name: string;
  hourly_rate: number;
  skills: string[];
  location: string;
  description: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const [profile, setProfile] = useState<HandymanProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    business_name: '',
    hourly_rate: '',
    skills: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('handyman_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile. Please try again.');
      } else if (data) {
        setProfile(data);
        setEditForm({
          business_name: data.business_name || '',
          hourly_rate: data.hourly_rate?.toString() || '',
          skills: data.skills?.join(', ') || '',
          location: data.location || '',
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      const profileData = {
        user_id: user.id,
        business_name: editForm.business_name,
        hourly_rate: parseFloat(editForm.hourly_rate) || 0,
        skills: editForm.skills.split(',').map(skill => skill.trim()).filter(skill => skill),
        location: editForm.location,
        description: editForm.description,
      };

      const { error } = profile
        ? await supabase
            .from('handyman_profiles')
            .update(profileData)
            .eq('user_id', user.id)
        : await supabase
            .from('handyman_profiles')
            .insert(profileData);

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      } else {
        Alert.alert('Success', 'Profile saved successfully!');
        setIsEditing(false);
        loadProfile();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Profile" />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="My Profile" />
      
      <ScrollView style={styles.content}>
        <View style={[
          styles.profileCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background },
          shadowPresets.small
        ]}>
          <View style={styles.profileHeader}>
            <ThemedText type="subtitle" style={styles.email}>
              {user?.email}
            </ThemedText>
            <Pressable
              style={[
                styles.editButton,
                { backgroundColor: Colors[colorScheme ?? 'light'].tint }
              ]}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {!profile && !isEditing ? (
            <View style={styles.noProfileContainer}>
              <ThemedText style={styles.noProfileText}>
                No profile set up yet
              </ThemedText>
              <ThemedText style={styles.noProfileSubtext}>
                Create your handyman profile to start receiving bookings
              </ThemedText>
              <Pressable
                style={[
                  styles.createProfileButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.createProfileButtonText}>Create Profile</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {isEditing ? (
                <View style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Business Name *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: Colors[colorScheme ?? 'light'].background,
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                          color: Colors[colorScheme ?? 'light'].text,
                        }
                      ]}
                      value={editForm.business_name}
                      onChangeText={(text) => setEditForm({ ...editForm, business_name: text })}
                      placeholder="Your business name"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Hourly Rate ($) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: Colors[colorScheme ?? 'light'].background,
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                          color: Colors[colorScheme ?? 'light'].text,
                        }
                      ]}
                      value={editForm.hourly_rate}
                      onChangeText={(text) => setEditForm({ ...editForm, hourly_rate: text })}
                      placeholder="25.00"
                      keyboardType="numeric"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Skills (comma separated)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: Colors[colorScheme ?? 'light'].background,
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                          color: Colors[colorScheme ?? 'light'].text,
                        }
                      ]}
                      value={editForm.skills}
                      onChangeText={(text) => setEditForm({ ...editForm, skills: text })}
                      placeholder="Plumbing, Electrical, Carpentry"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Location *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: Colors[colorScheme ?? 'light'].background,
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                          color: Colors[colorScheme ?? 'light'].text,
                        }
                      ]}
                      value={editForm.location}
                      onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                      placeholder="City, State"
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Description
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: Colors[colorScheme ?? 'light'].background,
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                          color: Colors[colorScheme ?? 'light'].text,
                        }
                      ]}
                      value={editForm.description}
                      onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                      placeholder="Describe your services and experience..."
                      multiline
                      numberOfLines={4}
                      placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                    />
                  </View>

                  <Pressable
                    style={[
                      styles.saveButton,
                      { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                    ]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.profileDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Business Name:
                    </Text>
                    <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {profile?.business_name || 'Not set'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Hourly Rate:
                    </Text>
                    <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      ${profile?.hourly_rate?.toFixed(2) || '0.00'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                      Location:
                    </Text>
                    <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {profile?.location || 'Not set'}
                    </Text>
                  </View>

                  {profile?.skills && profile.skills.length > 0 && (
                    <View style={styles.detailColumn}>
                      <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Skills:
                      </Text>
                      <View style={styles.skillsContainer}>
                        {profile.skills.map((skill, index) => (
                          <View
                            key={index}
                            style={[
                              styles.skillBadge,
                              { backgroundColor: Colors[colorScheme ?? 'light'].tabIconDefault }
                            ]}
                          >
                            <Text style={styles.skillText}>{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {profile?.description && (
                    <View style={styles.detailColumn}>
                      <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                        Description:
                      </Text>
                      <Text style={[styles.descriptionText, { color: Colors[colorScheme ?? 'light'].text }]}>
                        {profile.description}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        <Pressable
          style={[styles.signOutButton, { borderColor: '#F44336' }]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: '#F44336' }]}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  email: {
    fontSize: 18,
    flex: 1,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  noProfileContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProfileText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noProfileSubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  createProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createProfileButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  profileDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailColumn: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  signOutButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 40,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});