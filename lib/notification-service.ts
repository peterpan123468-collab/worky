import { Alert } from 'react-native';
import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'auction_started' | 'outbid' | 'auction_won' | 'auction_lost' | 'booking_confirmed' | 'booking_cancelled';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

export class NotificationService {
  
  /**
   * Show in-app notification
   */
  static showNotification(title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  }

  /**
   * Create notification in database
   */
  static async createNotification(
    userId: string, 
    type: Notification['type'], 
    title: string, 
    message: string, 
    data?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userId,
          type,
          title,
          message,
          data: data || {},
          read: false,
        }]);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return false;
    }
  }

  /**
   * Get notifications for user
   */
  static async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Subscribe to user notifications
   */
  static subscribeToUserNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          callback(notification);
          
          // Show in-app notification
          this.showNotification(notification.title, notification.message);
        }
      )
      .subscribe();
  }

  /**
   * Handle auction-specific notifications
   */
  static async handleAuctionEvent(
    auctionId: string,
    eventType: 'started' | 'new_bid' | 'ended',
    data?: any
  ): Promise<void> {
    try {
      // Get auction details
      const { data: auction, error } = await supabase
        .from('auctions')
        .select(`
          *,
          time_slots (
            handyman_id
          )
        `)
        .eq('id', auctionId)
        .single();

      if (error || !auction) {
        console.error('Error fetching auction for notification:', error);
        return;
      }

      const handymanId = auction.time_slots?.handyman_id;

      switch (eventType) {
        case 'started':
          // Notify handyman that auction started
          if (handymanId) {
            await this.createNotification(
              handymanId,
              'auction_started',
              'Auction Started!',
              `Multiple customers are bidding for your time slot. Starting bid: $${auction.starting_price.toFixed(2)}`,
              { auctionId }
            );
          }
          break;

        case 'new_bid':
          // Get all bidders except the new one
          const { data: bids } = await supabase
            .from('auction_bids')
            .select('customer_id, bid_amount')
            .eq('auction_id', auctionId)
            .order('created_at', { ascending: false });

          if (bids && bids.length > 1) {
            const latestBid = bids[0];
            const previousBidders = bids.slice(1);

            // Notify previous bidders that they've been outbid
            for (const bid of previousBidders) {
              if (bid.customer_id !== latestBid.customer_id) {
                await this.createNotification(
                  bid.customer_id,
                  'outbid',
                  'You\'ve been outbid!',
                  `Someone placed a higher bid of $${latestBid.bid_amount.toFixed(2)}. Place a new bid to stay in the auction.`,
                  { auctionId }
                );
              }
            }
          }
          break;

        case 'ended':
          // Notify winner and losers
          const { data: finalBids } = await supabase
            .from('auction_bids')
            .select('customer_id, bid_amount')
            .eq('auction_id', auctionId)
            .order('bid_amount', { ascending: false });

          if (finalBids && finalBids.length > 0) {
            const winner = finalBids[0];
            const losers = finalBids.slice(1);

            // Notify winner
            await this.createNotification(
              winner.customer_id,
              'auction_won',
              'Congratulations! You won the auction!',
              `You won the auction with a bid of $${winner.bid_amount.toFixed(2)}. Your booking has been confirmed.`,
              { auctionId }
            );

            // Notify losers
            for (const loser of losers) {
              await this.createNotification(
                loser.customer_id,
                'auction_lost',
                'Auction ended',
                `The auction ended. The winning bid was $${winner.bid_amount.toFixed(2)}. Better luck next time!`,
                { auctionId }
              );
            }

            // Notify handyman
            if (handymanId) {
              await this.createNotification(
                handymanId,
                'auction_won',
                'Auction completed!',
                `Your auction ended with a winning bid of $${winner.bid_amount.toFixed(2)}. The booking has been confirmed.`,
                { auctionId }
              );
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error handling auction event:', error);
    }
  }

  /**
   * Handle booking notifications
   */
  static async notifyBookingEvent(
    bookingId: string,
    eventType: 'created' | 'confirmed' | 'cancelled' | 'completed'
  ): Promise<void> {
    try {
      // Get booking details
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          time_slots (
            handyman_id,
            start_time,
            duration
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        console.error('Error fetching booking for notification:', error);
        return;
      }

      const customerId = booking.customer_id;
      const handymanId = booking.time_slots?.handyman_id;

      switch (eventType) {
        case 'created':
          if (handymanId) {
            await this.createNotification(
              handymanId,
              'booking_confirmed',
              'New Booking Request',
              `You have a new booking request for $${booking.final_price.toFixed(2)}. Please confirm or decline.`,
              { bookingId }
            );
          }
          break;

        case 'confirmed':
          await this.createNotification(
            customerId,
            'booking_confirmed',
            'Booking Confirmed!',
            `Your booking has been confirmed by the handyman. Get ready for your appointment!`,
            { bookingId }
          );
          break;

        case 'cancelled':
          await this.createNotification(
            customerId,
            'booking_cancelled',
            'Booking Cancelled',
            `Unfortunately, your booking has been cancelled. You can browse for other available slots.`,
            { bookingId }
          );
          break;

        case 'completed':
          await this.createNotification(
            customerId,
            'booking_confirmed',
            'Job Completed!',
            `Your job has been marked as completed. Thank you for using Worky!`,
            { bookingId }
          );
          break;
      }
    } catch (error) {
      console.error('Error handling booking event:', error);
    }
  }
}