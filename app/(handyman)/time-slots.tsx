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
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

interface TimeSlot {
  id: string;
  handyman_id: string;
  start_time: string;
  duration: number;
  status: 'available' | 'booked' | 'completed';
  created_at: string;
}

interface NewTimeSlot {
  date: string;
  time: string;
  duration: number;
}

export default function TimeSlotsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlot, setNewSlot] = useState<NewTimeSlot>({
    date: '',
    time: '',
    duration: 1,
  });

  useEffect(() => {
    if (user?.id) {
      loadTimeSlots();
    }
  }, [user?.id]);

  const loadTimeSlots = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('handyman_id', user.id)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading time slots:', error);
        Alert.alert('Error', 'Failed to load time slots. Please try again.');
      } else {
        setTimeSlots(data || []);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTimeSlot = async () => {
    if (!user?.id || !newSlot.date || !newSlot.time) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      // Combine date and time into ISO string
      const startDateTime = new Date(`${newSlot.date}T${newSlot.time}:00`);
      
      if (startDateTime <= new Date()) {
        Alert.alert('Invalid Time', 'Please select a future date and time.');
        return;
      }

      const { error } = await supabase
        .from('time_slots')
        .insert({
          handyman_id: user.id,
          start_time: startDateTime.toISOString(),
          duration: newSlot.duration,
          status: 'available',
        });

      if (error) {
        console.error('Error creating time slot:', error);
        Alert.alert('Error', 'Failed to create time slot. Please try again.');
      } else {
        Alert.alert('Success', 'Time slot created successfully!');
        setShowCreateModal(false);
        setNewSlot({ date: '', time: '', duration: 1 });
        loadTimeSlots();
      }
    } catch (error) {
      console.error('Error creating time slot:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleDeleteTimeSlot = async (slotId: string) => {
    Alert.alert(
      'Delete Time Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('time_slots')
                .delete()
                .eq('id', slotId);

              if (error) {
                console.error('Error deleting time slot:', error);
                Alert.alert('Error', 'Failed to delete time slot.');
              } else {
                loadTimeSlots();
              }
            } catch (error) {
              console.error('Error deleting time slot:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'booked':
        return '#FF9800';
      case 'completed':
        return '#9E9E9E';
      default:
        return Colors[colorScheme ?? 'light'].text;
    }
  };

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => {
    const { date, time } = formatDateTime(item.start_time);
    const statusColor = getStatusColor(item.status);

    return (
      <View style={[
        styles.slotCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
        shadowPresets.small
      ]}>
        <View style={styles.slotHeader}>
          <View style={styles.slotInfo}>
            <Text style={[styles.slotDate, { color: Colors[colorScheme ?? 'light'].text }]}>
              {date}
            </Text>
            <Text style={[styles.slotTime, { color: Colors[colorScheme ?? 'light'].text }]}>
              {time}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.slotDetails}>
          <Text style={[styles.duration, { color: Colors[colorScheme ?? 'light'].text }]}>
            Duration: {item.duration} hour{item.duration > 1 ? 's' : ''}
          </Text>
        </View>

        {item.status === 'available' && (
          <View style={styles.slotActions}>
            <Pressable
              style={[styles.deleteButton, { borderColor: '#F44336' }]}
              onPress={() => handleDeleteTimeSlot(item.id)}
            >
              <Text style={[styles.deleteButtonText, { color: '#F44336' }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <CustomHeader title="Time Slots" />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading time slots...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CustomHeader title="My Time Slots" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>
            Manage Your Available Time Slots
          </ThemedText>
          <Pressable
            style={[styles.createButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ Add Time Slot</Text>
          </Pressable>
        </View>

        <FlatList
          data={timeSlots}
          renderItem={renderTimeSlot}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No time slots yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Create your first time slot to start receiving bookings
              </ThemedText>
            </View>
          )}
        />
      </View>

      {/* Create Time Slot Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.createModal,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}>
            <ScrollView>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Create New Time Slot
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Date *
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
                  value={newSlot.date}
                  onChangeText={(text) => setNewSlot({ ...newSlot, date: text })}
                  placeholder={getTodayDate()}
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                />
                <Text style={[styles.helper, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  Format: YYYY-MM-DD (e.g., {getTodayDate()})
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Time *
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
                  value={newSlot.time}
                  onChangeText={(text) => setNewSlot({ ...newSlot, time: text })}
                  placeholder={getCurrentTime()}
                  placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
                />
                <Text style={[styles.helper, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  Format: HH:MM (e.g., 14:30)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Duration (hours) *
                </Text>
                <View style={styles.durationContainer}>
                  {[1, 2, 3, 4, 6, 8].map((duration) => (
                    <Pressable
                      key={duration}
                      style={[
                        styles.durationButton,
                        {
                          backgroundColor: newSlot.duration === duration 
                            ? Colors[colorScheme ?? 'light'].tint 
                            : 'transparent',
                          borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
                        }
                      ]}
                      onPress={() => setNewSlot({ ...newSlot, duration })}
                    >
                      <Text style={[
                        styles.durationText,
                        {
                          color: newSlot.duration === duration 
                            ? '#000' 
                            : Colors[colorScheme ?? 'light'].text
                        }
                      ]}>
                        {duration}h
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                  onPress={handleCreateTimeSlot}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    fontSize: 18,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  slotCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotInfo: {
    flex: 1,
  },
  slotDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  slotTime: {
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
  slotDetails: {
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    opacity: 0.8,
  },
  slotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
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
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});