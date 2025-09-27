import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useNotifications } from '../contexts/NotificationContext'
import { Card, CardContent } from './ui/card'
import { Ionicons } from '@expo/vector-icons'
import { formatSwissDateTime } from '../utils/timezone'

interface NotificationCenterProps {
  visible: boolean
  onClose: () => void
}

export function NotificationCenter({ visible, onClose }: NotificationCenterProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!visible) return null

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleDelete = async (id: string) => {
    await deleteNotification(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const getIconName = (type: string) => {
    switch (type) {
      case 'auction_outbid':
        return 'alert-circle'
      case 'auction_won':
        return 'trophy'
      case 'auction_ended':
        return 'time'
      case 'auction_lost':
        return 'close-circle'
      case 'booking_confirmed':
        return 'checkmark-circle'
      case 'booking_cancelled':
        return 'close-circle'
      case 'booking_completed':
        return 'checkmark-done-circle'
      case 'calendar_booking_request':
        return 'calendar'
      case 'auction_ending_soon':
        return 'hourglass'
      default:
        return 'notifications'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'auction_won':
      case 'booking_confirmed':
      case 'booking_completed':
        return '#10b981' // green
      case 'auction_outbid':
      case 'auction_ending_soon':
      case 'calendar_booking_request':
        return '#f59e0b' // amber
      case 'auction_lost':
      case 'booking_cancelled':
        return '#ef4444' // red
      default:
        return '#6366f1' // indigo
    }
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerActions}>
            {notifications.some(n => !n.read_at) && (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.notificationsContainer}>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateText}>No notifications</Text>
              <Text style={styles.emptyStateSubtext}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                style={[
                  styles.notificationCard,
                  !notification.read_at && styles.unreadCard
                ]}
              >
                <CardContent style={styles.notificationContent}>
                  <TouchableOpacity 
                    onPress={() => toggleExpand(notification.id)}
                    style={styles.notificationHeader}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons 
                        name={getIconName(notification.type)} 
                        size={20} 
                        color={getIconColor(notification.type)} 
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.read_at && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatSwissDateTime(notification.created_at)}
                      </Text>
                    </View>
                    <View style={styles.notificationActions}>
                      {!notification.read_at && (
                        <TouchableOpacity 
                          onPress={() => handleMarkAsRead(notification.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="checkmark" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        onPress={() => handleDelete(notification.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash" size={18} color="#94a3b8" />
                      </TouchableOpacity>
                      <Ionicons 
                        name={expandedId === notification.id ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#94a3b8" 
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedId === notification.id && (
                    <View style={styles.expandedContent}>
                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>
                      {notification.data && Object.keys(notification.data).length > 0 && (
                        <View style={styles.dataContainer}>
                          {Object.entries(notification.data).map(([key, value]) => (
                            <View key={key} style={styles.dataRow}>
                              <Text style={styles.dataKey}>{key}:</Text>
                              <Text style={styles.dataValue}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  notificationsContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  notificationCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unreadCard: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  notificationContent: {
    padding: 0,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  notificationTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dataKey: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '500',
    width: 100,
  },
  dataValue: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
})