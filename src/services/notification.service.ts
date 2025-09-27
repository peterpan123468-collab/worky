import { supabase } from '../lib/supabase'
import { Notification } from '../types/database.types'
import { Database } from '../types/database.types'

export type NotificationType = 
  | 'auction_outbid' 
  | 'auction_won' 
  | 'auction_ended' 
  | 'auction_lost'
  | 'booking_confirmed' 
  | 'booking_cancelled'
  | 'booking_completed'
  | 'calendar_booking_request'
  | 'auction_ending_soon'

export interface CreateNotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(payload: CreateNotificationPayload): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data || {},
          expires_at: this.calculateExpiry(payload.type)
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null)
        .gt('expires_at', new Date().toISOString())

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  /**
   * Calculate expiration time based on notification type
   */
  private calculateExpiry(type: NotificationType): string {
    const now = new Date()
    switch (type) {
      case 'auction_ending_soon':
        // Expire 1 hour after auction ends
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      case 'auction_outbid':
      case 'auction_won':
      case 'auction_lost':
        // Expire after 7 days
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_completed':
        // Expire after 30 days
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        // Default to 7 days
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
}

export const notificationService = new NotificationService()