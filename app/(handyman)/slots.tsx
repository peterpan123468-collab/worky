import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '@/lib/supabase';
import { shadowPresets } from '@/utils/shadows';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

interface TimeSlot {
  id: string;
  start_time: string;
  duration: number;
  status: 'available' | 'booked' | 'auction' | 'completed';
  created_at: string;
}

export default function HandymanSlots() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('handyman_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading slots:', error);
        Alert.alert('Error', 'Failed to load slots');
      } else {
        setSlots(data || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('time_slots')
                .delete()
                .eq('id', slotId);

              if (error) {
                Alert.alert('Error', 'Failed to delete slot');
              } else {
                loadSlots(); // Refresh the list
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete slot');
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
      case 'available': return '#4CAF50';
      case 'booked': return '#FF9800';
      case 'auction': return '#9C27B0';
      case 'completed': return '#757575';
      default: return Colors[colorScheme ?? 'light'].text;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'auction': return 'In Auction';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderSlot = ({ item }: { item: TimeSlot }) => {
    const { date, time } = formatDateTime(item.start_time);
    const canDelete = item.status === 'available';

    return (
      <View style={[styles.slotCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.slotHeader}>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.slotDate}>
              {date}
            </ThemedText>
            <ThemedText style={styles.slotTime}>
              {time} ({item.duration}h)
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
        </View>

        {canDelete && (
          <View style={styles.slotActions}>
            <Pressable
              style={[styles.deleteButton, { borderColor: '#F44336' }]}
              onPress={() => deleteSlot(item.id)}
            >
              <ThemedText style={[styles.deleteButtonText, { color: '#F44336' }]}>
                Delete
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading slots...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          My Time Slots
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Manage your available time slots
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.createButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={() => setShowCreateModal(true)}
        >
          <ThemedText style={styles.createButtonText}>
            + Create New Slot
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={slots}
        renderItem={renderSlot}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              No time slots created yet
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first slot to start getting bookings
            </ThemedText>
          </View>
        )}
      />

      <CreateSlotModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSlotCreated={loadSlots}
      />
    </ThemedView>
  );
}

// Create Slot Modal Component
interface CreateSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSlotCreated: () => void;
}

function CreateSlotModal({ visible, onClose, onSlotCreated }: CreateSlotModalProps) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('2');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const createSlot = async () => {
    if (!user || !selectedDate || !selectedTime || !duration) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (startDateTime <= now) {
      Alert.alert('Error', 'Please select a future date and time');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 12) {
      Alert.alert('Error', 'Duration must be between 1 and 12 hours');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('time_slots')
        .insert([
          {
            handyman_id: user.id,
            start_time: startDateTime.toISOString(),
            duration: durationNum,
            status: 'available',
          }
        ]);

      if (error) {
        console.error('Error creating slot:', error);
        Alert.alert('Error', 'Failed to create slot. Please try again.');
      } else {
        Alert.alert('Success', 'Time slot created successfully!');
        onSlotCreated();
        onClose();
        setSelectedDate('');
        setSelectedTime('');
        setDuration('2');
      }
    } catch (error) {
      console.error('Error creating slot:', error);
      Alert.alert('Error', 'Failed to create slot. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      supportedOrientations={['portrait', 'landscape']}
      statusBarTranslucent={false}
    >
      <ThemedView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <ThemedText type="title" style={styles.modalTitle}>
            Create Time Slot
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <ThemedText style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              Cancel
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Date *</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              value={selectedDate}
              onChangeText={setSelectedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Time *</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              value={selectedTime}
              onChangeText={setSelectedTime}
              placeholder="HH:MM (24-hour format)"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Duration (hours) *</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                  color: Colors[colorScheme ?? 'light'].text,
                }
              ]}
              value={duration}
              onChangeText={setDuration}
              placeholder="1-12 hours"
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              keyboardType="numeric"
            />
          </View>

          <Pressable
            style={[
              styles.createSlotButton,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
              isLoading && styles.buttonDisabled
            ]}
            onPress={createSlot}
            disabled={isLoading}
          >
            <ThemedText style={styles.createSlotButtonText}>
              {isLoading ? 'Creating...' : 'Create Slot'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    </Modal>
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
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  createButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotDate: {
    fontSize: 16,
    marginBottom: 2,
  },
  slotTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  slotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  deleteButtonText: {
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
  // Modal styles
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  createSlotButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createSlotButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});