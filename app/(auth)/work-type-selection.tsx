import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { getWorkTypesByCategory, MVP_WORK_TYPES, WORK_CATEGORIES, WorkCategory, WorkType } from '@/constants/WorkTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WorkTypeSelectionScreen() {
  const { user, userType, refreshUserData } = useAuth();
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMVPOnly, setShowMVPOnly] = useState(true);
  const colorScheme = useColorScheme();

  const handleWorkTypeToggle = (workTypeId: string) => {
    setSelectedWorkTypes(prev => {
      if (prev.includes(workTypeId)) {
        return prev.filter(id => id !== workTypeId);
      } else {
        return [...prev, workTypeId];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedWorkTypes.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one type of work you specialize in.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current profile data
      const { data: currentData } = await supabase
        .from('users')
        .select('profile_data')
        .eq('id', user.id)
        .single();

      // Update user profile with selected work types
      const updatedProfileData = {
        ...currentData?.profile_data,
        work_types: selectedWorkTypes,
        work_setup_completed: true
      };

      const { error } = await supabase
        .from('users')
        .update({ 
          profile_data: updatedProfileData
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating work types:', error);
        Alert.alert('Error', 'Failed to save work type selection. Please try again.');
        return;
      }

      // Refresh user data to update state
      await refreshUserData();
      
      // Navigate back to index to trigger proper redirect
      router.replace('/');
    } catch (error) {
      console.error('Error saving work types:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkTypesByCategory = () => {
    const categories: WorkCategory[] = ['utilities', 'construction', 'repairs', 'outdoor'];
    const workTypesToShow = showMVPOnly ? MVP_WORK_TYPES : [];
    
    if (showMVPOnly) {
      return (
        <View style={styles.categorySection}>
          <View style={styles.mvpHeader}>
            <ThemedText type="subtitle" style={styles.categoryTitle}>
              🚀 Most Popular Services (Recommended)
            </ThemedText>
            <Text style={[styles.mvpBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
              MVP
            </Text>
          </View>
          <Text style={[styles.categoryDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
            Start with these high-demand services to get more bookings
          </Text>
          {workTypesToShow.map((workType) => renderWorkType(workType))}
        </View>
      );
    }

    return categories.map((category) => {
      const categoryWorkTypes = getWorkTypesByCategory(category);
      
      return (
        <View key={category} style={styles.categorySection}>
          <ThemedText type="subtitle" style={styles.categoryTitle}>
            {WORK_CATEGORIES[category]}
          </ThemedText>
          {categoryWorkTypes.map((workType) => renderWorkType(workType))}
        </View>
      );
    });
  };

  const renderWorkType = (workType: WorkType) => {
    const isSelected = selectedWorkTypes.includes(workType.id);
    const isMVP = workType.priority <= 5;
    
    return (
      <Pressable
        key={workType.id}
        style={[
          styles.workTypeOption,
          {
            backgroundColor: isSelected 
              ? Colors[colorScheme ?? 'light'].tint 
              : Colors[colorScheme ?? 'light'].background,
            borderColor: isSelected
              ? Colors[colorScheme ?? 'light'].tint
              : Colors[colorScheme ?? 'light'].tabIconDefault,
          },
          shadowPresets.small,
        ]}
        onPress={() => handleWorkTypeToggle(workType.id)}
      >
        <View style={styles.workTypeHeader}>
          <View style={styles.workTypeInfo}>
            <View style={styles.workTypeTitleRow}>
              <ThemedText 
                style={[
                  styles.workTypeName,
                  {
                    color: isSelected 
                      ? '#fff' 
                      : Colors[colorScheme ?? 'light'].text
                  }
                ]}
              >
                {workType.name}
              </ThemedText>
              {isMVP && !showMVPOnly && (
                <Text style={[styles.priorityBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                  Popular
                </Text>
              )}
            </View>
            <ThemedText 
              style={[
                styles.workTypeDescription,
                {
                  color: isSelected 
                    ? 'rgba(255, 255, 255, 0.8)' 
                    : Colors[colorScheme ?? 'light'].text,
                  opacity: isSelected ? 1 : 0.7
                }
              ]}
            >
              {workType.description}
            </ThemedText>
          </View>
          <View style={[
            styles.checkbox,
            {
              backgroundColor: isSelected 
                ? '#fff' 
                : 'transparent',
              borderColor: isSelected
                ? '#fff'
                : Colors[colorScheme ?? 'light'].tabIconDefault,
            }
          ]}>
            {isSelected && (
              <Text style={[styles.checkmark, { color: Colors[colorScheme ?? 'light'].tint }]}>✓</Text>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  // Only show for handymen
  if (userType !== 'handyman') {
    // For customers, skip this step and go directly to dashboard
    router.replace('/');
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Choose Your Services
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Select the types of work you specialize in. You can add more later.
        </ThemedText>
      </View>

      <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            {
              backgroundColor: showMVPOnly 
                ? Colors[colorScheme ?? 'light'].tint 
                : 'transparent',
              borderColor: Colors[colorScheme ?? 'light'].tint,
            }
          ]}
          onPress={() => setShowMVPOnly(true)}
        >
          <Text style={[
            styles.toggleText,
            { color: showMVPOnly ? '#000' : Colors[colorScheme ?? 'light'].tint }
          ]}>
            Popular Services
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.toggleButton,
            {
              backgroundColor: !showMVPOnly 
                ? Colors[colorScheme ?? 'light'].tint 
                : 'transparent',
              borderColor: Colors[colorScheme ?? 'light'].tint,
            }
          ]}
          onPress={() => setShowMVPOnly(false)}
        >
          <Text style={[
            styles.toggleText,
            { color: !showMVPOnly ? '#000' : Colors[colorScheme ?? 'light'].tint }
          ]}>
            All Services
          </Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.workTypesContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {renderWorkTypesByCategory()}
      </ScrollView>

      <View style={styles.footer}>
        {selectedWorkTypes.length > 0 && (
          <Text style={[styles.selectionCount, { color: Colors[colorScheme ?? 'light'].text }]}>
            {selectedWorkTypes.length} service{selectedWorkTypes.length > 1 ? 's' : ''} selected
          </Text>
        )}
        <Pressable
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedWorkTypes.length > 0 
                ? Colors[colorScheme ?? 'light'].tint 
                : Colors[colorScheme ?? 'light'].tabIconDefault,
            },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedWorkTypes.length === 0 || isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 40,
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
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  workTypesContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  mvpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  mvpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  workTypeOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  workTypeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  workTypeInfo: {
    flex: 1,
  },
  workTypeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workTypeName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#000',
  },
  workTypeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  selectionCount: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.7,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});