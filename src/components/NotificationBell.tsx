import React, { useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNotifications } from '../contexts/NotificationContext'
import { NotificationCenter } from './NotificationCenter'

export function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      <TouchableOpacity 
        style={styles.bellContainer} 
        onPress={() => setShowNotifications(true)}
      >
        <Ionicons name="notifications" size={24} color="#ffffff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <View style={styles.badgeBackground}>
              <View style={styles.badgeInner}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <NotificationCenter 
        visible={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  )
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  badgeBackground: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeInner: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
})