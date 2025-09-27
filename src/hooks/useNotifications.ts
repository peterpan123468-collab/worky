import { useEffect, useState, useCallback } from 'react'
import { notificationService } from '../services/notification.service'
import { Notification } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'

export function useNotificationManager() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [notifs, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id)
      ])
      
      setNotifications(notifs)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const success = await notificationService.markAsRead(id)
      if (success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, read_at: new Date().toISOString() } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const success = await notificationService.markAllAsRead(user.id)
      if (success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [user?.id])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const success = await notificationService.deleteNotification(id)
      if (success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id))
        // Update unread count if the deleted notification was unread
        const wasUnread = notifications.find(n => n.id === id)?.read_at === null
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [notifications])

  // Fetch notifications when user changes
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}