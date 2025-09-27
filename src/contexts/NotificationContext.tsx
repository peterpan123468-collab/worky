import React, { createContext, useContext, useEffect } from 'react'
import { Notification } from '../types/database.types'
import { useAuth } from './AuthContext'
import { useNotificationManager } from '../hooks/useNotifications'
import { supabase } from '../lib/supabase'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationManager()

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh notifications when a new one is added
          refresh()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh notifications when one is updated
          refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refresh])

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}