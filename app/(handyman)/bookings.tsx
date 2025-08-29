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
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface Booking {
  id: string;
  slot_id: string;
  customer_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  final_price: number;
  created_at: string;
  // Joined data from time_slots
  start_time: string;
  duration: number;
  // Joined data from users (customer)
  customer_email: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const statusFilters: FilterStatus[] = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  useEffect(() => {
    if (user?.id) {
      loadBookings();
    }
  }, [user?.id]);

  useEffect(() => {
    // Filter bookings based on active filter
    if (activeFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === activeFilter));
    }
  }, [bookings, activeFilter]);

  const loadBookings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          time_slots!inner(start_time, duration, handyman_id),
          users!bookings_customer_id_fkey(email)
        `)
        .eq('time_slots.handyman_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        Alert.alert('Error', 'Failed to load bookings. Please try again.');
      } else {
        // Transform the data to flatten the joined fields
        const transformedBookings = (data || []).map(booking => ({
          ...booking,
          start_time: booking.time_slots.start_time,
          duration: booking.time_slots.duration,
          customer_email: booking.users.email,
        }));
        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBookings();
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        Alert.alert('Error', 'Failed to update booking status.');
        return false;
      }

      // If confirming or completing, also update the time slot status
      if (newStatus === 'confirmed' || newStatus === 'completed') {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          const slotStatus = newStatus === 'confirmed' ? 'booked' : 'completed';
          await supabase
            .from('time_slots')
            .update({ status: slotStatus })
            .eq('id', booking.slot_id);
        }
      }

      await loadBookings();
      return true;
    } catch (error) {
      console.error('Error updating booking status:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
      return false;
    }
  };

  const handleAcceptBooking = (bookingId: string) => {
    Alert.alert(
      'Accept Booking',
      'Are you sure you want to accept this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => updateBookingStatus(bookingId, 'confirmed'),
        },
      ]
    );
  };

  const handleDeclineBooking = (bookingId: string) => {
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => updateBookingStatus(bookingId, 'cancelled'),
        },
      ]
    );
  };

  const handleCompleteBooking = (bookingId: string) => {
    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => updateBookingStatus(bookingId, 'completed'),
        },
      ]
    );
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'confirmed':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return Colors[colorScheme ?? 'light'].text;
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderFilterButton = (filter: FilterStatus) => {
    const isActive = activeFilter === filter;
    const count = filter === 'all' ? bookings.length : bookings.filter(b => b.status === filter).length;
    
    return (
      <Pressable
        key={filter}
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive 
              ? Colors[colorScheme ?? 'light'].tint 
              : 'transparent',
            borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          }
        ]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[
          styles.filterButtonText,
          {
            color: isActive 
              ? '#000' 
              : Colors[colorScheme ?? 'light'].text
          }
        ]}>
          {getStatusDisplayName(filter)} ({count})
        </Text>
      </Pressable>
    );
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const { date, time } = formatDateTime(item.start_time);
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[
        styles.bookingCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
        shadowPresets.small
      ]}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingInfo}>
            <Text style={[styles.bookingDate, { color: Colors[colorScheme ?? 'light'].text }]}>
              {date} at {time}
            </Text>
            <Text style={[styles.customerEmail, { color: Colors[colorScheme ?? 'light'].text }]}>
              {item.customer_email}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusDisplayName(item.status)}</Text>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <Text style={[styles.duration, { color: Colors[colorScheme ?? 'light'].text }]}>
            Duration: {item.duration} hour{item.duration > 1 ? 's' : ''}
          </Text>
          <Text style={[styles.price, { color: Colors[colorScheme ?? 'light'].tint }]}>
            {formatPrice(item.final_price)}
          </Text>
        </View>

        <View style={styles.paymentStatus}>
          <Text style={[
            styles.paymentStatusText, 
            { 
              color: item.payment_status === 'paid' 
                ? '#4CAF50' 
                : item.payment_status === 'refunded'
                ? '#FF9800'
                : '#F44336'
            }
          ]}>
            Payment: {getStatusDisplayName(item.payment_status)}
          </Text>
        </View>

        {/* Action buttons based on status */}
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleAcceptBooking(item.id)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleDeclineBooking(item.id)}
            >
              <Text style={styles.actionButtonText}>Decline</Text>
            </Pressable>
          </View>
        )}

        {item.status === 'confirmed' && (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={() => handleCompleteBooking(item.id)}
            >
              <Text style={[styles.actionButtonText, { color: '#000' }]}>Mark Complete</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Bookings" />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading bookings...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="My Bookings" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Manage Your Bookings
          </ThemedText>
        </View>

        {/* Filter buttons */}
        <View style={styles.filtersContainer}>
          {statusFilters.map(renderFilterButton)}
        </View>

        <FlatList
          data={filteredBookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                {activeFilter === 'all' ? 'No bookings yet' : `No ${activeFilter} bookings`}
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                {activeFilter === 'all' 
                  ? 'Bookings will appear here when customers book your time slots'
                  : `No bookings with ${activeFilter} status`
                }
              </ThemedText>
            </View>
          )}
        />
      </View>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    opacity: 0.8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatus: {
    marginBottom: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
});