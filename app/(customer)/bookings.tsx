import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

interface CustomerBooking {
  id: string;
  slot_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  final_price: number;
  created_at: string;
  time_slots: {
    start_time: string;
    duration: number;
    handyman_id: string;
    users: {
      handyman_profiles: {
        business_name: string;
        location: string;
        hourly_rate: number;
      };
    };
  };
}

export default function CustomerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadBookings();
    
    // Set up real-time subscription for booking updates
    const subscription = supabase
      .channel('customer_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${user?.id}`,
        },
        () => {
          loadBookings(); // Refresh bookings when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          time_slots (
            start_time,
            duration,
            handyman_id,
            users!time_slots_handyman_id_fkey (
              handyman_profiles (
                business_name,
                location,
                hourly_rate
              )
            )
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        Alert.alert('Error', 'Failed to load bookings');
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string, status: string) => {
    if (status !== 'pending') {
      Alert.alert('Cannot Cancel', 'Only pending bookings can be cancelled');
      return;
    }

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

              if (error) {
                console.error('Error cancelling booking:', error);
                Alert.alert('Error', 'Failed to cancel booking');
              } else {
                loadBookings(); // Refresh the list
                Alert.alert('Success', 'Booking cancelled successfully');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
          style: 'destructive' 
        }
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return Colors[colorScheme ?? 'light'].text;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'The handyman will respond to your booking request soon';
      case 'confirmed': return 'Your booking has been confirmed by the handyman';
      case 'completed': return 'This job has been completed';
      case 'cancelled': return 'This booking was cancelled';
      default: return '';
    }
  };

  const renderBooking = ({ item }: { item: CustomerBooking }) => {
    const { date, time } = formatDateTime(item.time_slots.start_time);
    const isPending = item.status === 'pending';
    
    return (
      <View style={[styles.bookingCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.bookingHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.businessName}>
              {item.time_slots.users?.handyman_profiles?.business_name}
            </ThemedText>
            <ThemedText style={styles.location}>
              {item.time_slots.users?.handyman_profiles?.location}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <ThemedText style={styles.dateTime}>
            📅 {date} at {time}
          </ThemedText>
          <ThemedText style={styles.duration}>
            ⏱️ Duration: {item.time_slots.duration} hour{item.time_slots.duration > 1 ? 's' : ''}
          </ThemedText>
          <ThemedText style={styles.price}>
            💰 Total: ${item.final_price.toFixed(2)}
          </ThemedText>
        </View>

        <View style={styles.statusInfo}>
          <ThemedText style={styles.statusDescription}>
            {getStatusDescription(item.status)}
          </ThemedText>
        </View>

        <View style={styles.bookingFooter}>
          <ThemedText style={styles.bookingDate}>
            Booked on {formatDateTime(item.created_at).date}
          </ThemedText>
          
          {isPending && (
            <Pressable
              style={[styles.cancelButton, { borderColor: '#F44336' }]}
              onPress={() => cancelBooking(item.id, item.status)}
            >
              <ThemedText style={[styles.cancelButtonText, { color: '#F44336' }]}>
                Cancel
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading your bookings...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Bookings
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Track your booking requests and confirmed jobs
        </ThemedText>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No bookings yet
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Browse available time slots to make your first booking
            </ThemedText>
          </View>
        )}
      />
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    ...shadowPresets.medium,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 12,
    gap: 4,
  },
  dateTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  duration: {
    fontSize: 14,
    opacity: 0.8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusInfo: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: 12,
    opacity: 0.6,
    flex: 1,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});