import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

interface DashboardStats {
  activeSlots: number;
  pendingBookings: number;
  totalEarnings: number;
  completedJobs: number;
}

export default function HandymanDashboard() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeSlots: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    completedJobs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Load active slots
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('handyman_id', user.id)
        .eq('status', 'available');

      // Load bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, time_slots(*)')
        .eq('time_slots.handyman_id', user.id);

      if (slotsError || bookingsError) {
        console.error('Error loading dashboard data:', slotsError || bookingsError);
      } else {
        const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;
        const completedBookings = bookings?.filter(b => b.status === 'completed') || [];
        const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.final_price || 0), 0);

        setStats({
          activeSlots: slots?.length || 0,
          pendingBookings,
          totalEarnings,
          completedJobs: completedBookings.length,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading dashboard...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.welcomeText}>
            Welcome back!
          </ThemedText>
          <ThemedText style={styles.emailText}>
            {user?.email}
          </ThemedText>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <ThemedText style={[styles.signOutText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Sign Out
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.activeSlots}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Active Slots</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.pendingBookings}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Pending Bookings</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              ${stats.totalEarnings.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Total Earnings</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              {stats.completedJobs}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Completed Jobs</ThemedText>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push('/(handyman)/time-slots')}
          >
            <ThemedText style={styles.actionButtonText}>
              Manage Time Slots
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.secondaryButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push('/(handyman)/bookings')}
          >
            <ThemedText style={[styles.actionButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              View Bookings
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.quickTips}>
          <ThemedText type="subtitle" style={styles.tipsTitle}>
            Quick Tips
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • Add spontaneous time slots to get more bookings
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • Respond quickly to booking requests
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • Keep your hourly rate competitive
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    ...shadowPresets.medium,
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickTips: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  tipsTitle: {
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
});