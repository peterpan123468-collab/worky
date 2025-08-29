import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { REGION_CATEGORIES, SWISS_REGIONS, SwissRegion } from '@/constants/SwissRegions';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RegionSelectionScreen() {
  const { user, userType, refreshUserData } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<SwissRegion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

  // Debug logging
  console.log('🌍 REGION SCREEN LOADED - User details:', {
    userId: user?.id || 'no user',
    userType: userType,
    timestamp: new Date().toISOString()
  });

  const handleRegionSelect = (region: SwissRegion) => {
    console.log('📍 Region selected:', region.name);
    setSelectedRegion(region);
  };

  const handleContinue = async () => {
    if (!selectedRegion || !user) {
      Alert.alert('Selection Required', 'Please select a region to continue.');
      return;
    }

    console.log('💾 Saving region selection:', selectedRegion.name);
    setIsLoading(true);
    
    try {
      // Update user profile with selected region
      const { error } = await supabase
        .from('users')
        .update({ 
          profile_data: { 
            selected_region: selectedRegion.id,
            region_name: selectedRegion.name 
          }
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error updating region:', error);
        Alert.alert('Error', 'Failed to save region selection. Please try again.');
        return;
      }

      console.log('✅ Region saved successfully');
      // Refresh user data to update hasSelectedRegion state
      await refreshUserData();
      
      // Navigate based on user type
      if (userType === 'handyman') {
        console.log('🔧 Handyman - going to work type selection');
        router.replace('/(auth)/work-type-selection');
      } else {
        console.log('👤 Customer - going to dashboard');
        router.replace('/');
      }
    } catch (error) {
      console.error('💥 Unexpected error saving region:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegionsByCategory = () => {
    const categories = ['german', 'french', 'italian', 'alpine'] as const;
    
    return categories.map((category) => {
      const categoryRegions = SWISS_REGIONS.filter(region => region.category === category);
      
      return (
        <View key={category} style={styles.categorySection}>
          <ThemedText type="subtitle" style={styles.categoryTitle}>
            {REGION_CATEGORIES[category]}
          </ThemedText>
          {categoryRegions.map((region) => (
            <Pressable
              key={region.id}
              style={[
                styles.regionOption,
                {
                  backgroundColor: selectedRegion?.id === region.id 
                    ? Colors[colorScheme ?? 'light'].tint 
                    : Colors[colorScheme ?? 'light'].background,
                  borderColor: selectedRegion?.id === region.id
                    ? Colors[colorScheme ?? 'light'].tint
                    : Colors[colorScheme ?? 'light'].tabIconDefault,
                },
              ]}
              onPress={() => handleRegionSelect(region)}
            >
              <ThemedText 
                style={[
                  styles.regionText,
                  {
                    color: selectedRegion?.id === region.id 
                      ? '#fff' 
                      : Colors[colorScheme ?? 'light'].text
                  }
                ]}
              >
                {region.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      );
    });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Choose Your Region
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Select the Swiss region where you'll be using Worky
        </ThemedText>
      </View>

      <ScrollView 
        style={styles.regionsContainer}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        {renderRegionsByCategory()}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedRegion 
                ? Colors[colorScheme ?? 'light'].tint 
                : Colors[colorScheme ?? 'light'].tabIconDefault,
            },
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRegion || isLoading}
        >
          <Text style={[styles.continueButtonText, { color: '#fff' }]}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
        </Pressable>
      </View>
      
      {/* Debug info */}
      <Text style={styles.debugText}>
        User: {user?.email || 'Not logged in'} | Type: {userType || 'Unknown'}
      </Text>
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
    marginBottom: 30,
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
  regionsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  regionOption: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  regionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});