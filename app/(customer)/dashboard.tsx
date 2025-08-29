import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PaymentService } from '@/lib/payment-service';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface TimeSlot {
  id: string;
  handyman_id: string;
  start_time: string;
  duration: number;
  status: string;
  users: {
    handyman_profiles: {
      business_name: string;
      hourly_rate: number;
      location: string;
      skills: string[];
    };
  };
}

export default function CustomerDashboard() {
  const { user, signOut } = useAuth();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadAvailableSlots();
    
    // Set up real-time subscription for slot updates
    const subscription = supabase
      .channel('available_slots')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_slots',
        },
        () => {
          loadAvailableSlots(); // Refresh slots when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select(`
          *,
          users!time_slots_handyman_id_fkey (
            handyman_profiles (
              business_name,
              hourly_rate,
              location,
              skills
            )
          )
        `)
        .eq('status', 'available')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading slots:', error);
        Alert.alert('Error', 'Failed to load available slots');
      } else {
        setAvailableSlots(data || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSlots = availableSlots.filter(slot => 
    slot.users?.handyman_profiles?.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slot.users?.handyman_profiles?.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slot.users?.handyman_profiles?.skills?.some(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleBookSlot = (slot: TimeSlot) => {
    const profile = slot.users?.handyman_profiles;
    if (!profile) {
      Alert.alert('Error', 'Handyman profile not found');
      return;
    }
    
    Alert.alert(
      'Book This Slot',
      `Book ${profile.business_name} for ${slot.duration} hours at $${profile.hourly_rate}/hour?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => bookSlot(slot),
          style: 'default'
        }
      ]
    );
  };

  const bookSlot = async (slot: TimeSlot) => {
    if (!user) return;

    const profile = slot.users?.handyman_profiles;
    if (!profile) {
      Alert.alert('Error', 'Handyman profile not found');
      return;
    }

    try {
      // Check if slot is still available
      const { data: currentSlot, error: checkError } = await supabase
        .from('time_slots')
        .select('status')
        .eq('id', slot.id)
        .single();

      if (checkError || currentSlot?.status !== 'available') {
        Alert.alert('Slot Unavailable', 'This slot is no longer available.');
        loadAvailableSlots(); // Refresh the list
        return;
      }

      // Create booking
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert([
          {
            slot_id: slot.id,
            customer_id: user.id,
            status: 'pending',
            payment_status: 'unpaid',
            final_price: profile.hourly_rate * slot.duration,
          }
        ])
        .select('id')
        .single();

      if (error) {
        console.error('Error booking slot:', error);
        if (error.code === '23505') {
          Alert.alert('Booking Conflict', 'Another customer is already booking this slot. An auction may start soon.');
        } else {
          Alert.alert('Booking Failed', 'Failed to book the slot. Please try again.');
        }
        return;
      }

      // Process payment
      const totalAmount = profile.hourly_rate * slot.duration;
      const paymentResult = await PaymentService.processBookingPayment(bookingData.id, totalAmount);
      
      if (paymentResult.success) {
        Alert.alert(
          'Booking Successful!', 
          `Your booking has been confirmed and payment of $${totalAmount.toFixed(2)} has been processed.`,
          [{ text: 'OK', onPress: () => loadAvailableSlots() }]
        );
      } else {
        // Payment failed, cancel the booking
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', bookingData.id);
          
        Alert.alert('Payment Failed', paymentResult.error || 'Payment could not be processed.');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      Alert.alert('Booking Failed', 'Failed to book the slot. Please try again.');
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

  const renderSlot = ({ item }: { item: TimeSlot }) => {
    const { date, time } = formatDateTime(item.start_time);
    const profile = item.users?.handyman_profiles;
    
    if (!profile) {
      return null; // Skip rendering if no profile data
    }
    
    const totalPrice = profile.hourly_rate * item.duration;

    return (
      <View style={[styles.slotCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.slotHeader}>
          <ThemedText type="defaultSemiBold" style={styles.businessName}>
            {profile.business_name}
          </ThemedText>
          <ThemedText style={styles.location}>
            {profile.location}
          </ThemedText>
        </View>

        <View style={styles.slotDetails}>
          <ThemedText style={styles.dateTime}>
            {date} at {time}
          </ThemedText>
          <ThemedText style={styles.duration}>
            Duration: {item.duration} hour{item.duration > 1 ? 's' : ''}
          </ThemedText>
          <ThemedText style={styles.skills}>
            Skills: {profile.skills?.join(', ') || 'General'}
          </ThemedText>
        </View>

        <View style={styles.slotFooter}>
          <View>
            <ThemedText style={styles.rate}>
              ${profile.hourly_rate}/hour
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.totalPrice}>
              Total: ${totalPrice.toFixed(2)}
            </ThemedText>
          </View>
          <Pressable
            style={[styles.bookButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => handleBookSlot(item)}
          >
            <ThemedText style={styles.bookButtonText}>
              Book Now
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading available slots...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Find Immediate Help
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Book handymen for urgent tasks
        </ThemedText>
        <Pressable onPress={handleSignOut} style={styles.signOutButton}>
          <ThemedText style={[styles.signOutText, { color: Colors[colorScheme ?? 'light'].tint }]}>
            Sign Out
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
              color: Colors[colorScheme ?? 'light'].text,
            }
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by business, location, or skills..."
          placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
        />
      </View>

      <FlatList
        data={filteredSlots}
        renderItem={renderSlot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'No slots match your search' : 'No available slots at the moment'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Check back later for new opportunities
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
    marginBottom: 8,
  },
  signOutButton: {
    alignSelf: 'flex-start',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  slotCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    ...shadowPresets.medium,
  },
  slotHeader: {
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    opacity: 0.7,
  },
  slotDetails: {
    marginBottom: 12,
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  duration: {
    fontSize: 14,
    marginBottom: 2,
  },
  skills: {
    fontSize: 14,
    opacity: 0.8,
  },
  slotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rate: {
    fontSize: 14,
    opacity: 0.7,
  },
  totalPrice: {
    fontSize: 16,
  },
  bookButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
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
  },
});