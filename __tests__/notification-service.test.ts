import { Alert } from 'react-native';
import { NotificationService } from '../lib/notification-service';
import { supabase } from '../lib/supabase';

// Mock React Native Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

describe('NotificationService', () => {
  const mockSupabaseChain = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
  };

  const mockChannel = {
    on: jest.fn(),
    subscribe: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Supabase mock chain
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
    
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.insert.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.update.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.order.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.limit.mockReturnValue(mockSupabaseChain);
    
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
  });

  describe('showNotification', () => {
    it('should show notification using Alert.alert', () => {
      NotificationService.showNotification('Test Title', 'Test Message', 'info');
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Test Title',
        'Test Message',
        [{ text: 'OK', style: 'default' }]
      );
    });

    it('should default to info type', () => {
      NotificationService.showNotification('Title', 'Message');
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Title',
        'Message',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      mockSupabaseChain.insert.mockResolvedValueOnce({
        data: [{
          id: 'notif-123',
          user_id: 'user-123',
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
          read: false,
        }],
        error: null,
      });

      const result = await NotificationService.createNotification(
        'user-123',
        'booking_confirmed',
        'Booking Confirmed',
        'Your booking has been confirmed',
        { bookingId: 'booking-123' }
      );

      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith([{
        user_id: 'user-123',
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your booking has been confirmed',
        data: { bookingId: 'booking-123' },
        read: false,
      }]);
    });

    it('should handle database error', async () => {
      mockSupabaseChain.insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await NotificationService.createNotification(
        'user-123',
        'booking_confirmed',
        'Title',
        'Message'
      );

      expect(result).toBe(false);
    });

    it('should handle data parameter as optional', async () => {
      mockSupabaseChain.insert.mockResolvedValueOnce({
        data: [{}],
        error: null,
      });

      const result = await NotificationService.createNotification(
        'user-123',
        'auction_started',
        'Title',
        'Message'
      );

      expect(result).toBe(true);
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith([{
        user_id: 'user-123',
        type: 'auction_started',
        title: 'Title',
        message: 'Message',
        data: {},
        read: false,
      }]);
    });
  });

  describe('getUserNotifications', () => {
    it('should fetch user notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: 'Your booking has been confirmed',
          read: false,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'notif-2',
          type: 'auction_started',
          title: 'Auction Started',
          message: 'An auction has started',
          read: true,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: mockNotifications,
        error: null,
      });

      const result = await NotificationService.getUserNotifications('user-123');

      expect(result).toEqual(mockNotifications);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabaseChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabaseChain.limit).toHaveBeenCalledWith(50);
    });

    it('should handle custom limit', async () => {
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await NotificationService.getUserNotifications('user-123', 10);

      expect(mockSupabaseChain.limit).toHaveBeenCalledWith(10);
    });

    it('should handle database error', async () => {
      mockSupabaseChain.limit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await NotificationService.getUserNotifications('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: [{ id: 'notif-123', read: true }],
        error: null,
      });

      const result = await NotificationService.markAsRead('notif-123');

      expect(result).toBe(true);
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'notif-123');
    });

    it('should handle database error', async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await NotificationService.markAsRead('notif-123');

      expect(result).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: [{ id: 'notif-1' }, { id: 'notif-2' }],
        error: null,
      });

      const result = await NotificationService.markAllAsRead('user-123');

      expect(result).toBe(true);
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('read', false);
    });

    it('should handle database error', async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await NotificationService.markAllAsRead('user-123');

      expect(result).toBe(false);
    });
  });

  describe('subscribeToUserNotifications', () => {
    it('should setup real-time subscription', () => {
      const mockCallback = jest.fn();
      
      NotificationService.subscribeToUserNotifications('user-123', mockCallback);

      expect(supabase.channel).toHaveBeenCalledWith('user_notifications_user-123');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.user-123',
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should call callback and show notification on new notification', () => {
      const mockCallback = jest.fn();
      const mockNotification = {
        id: 'notif-123',
        title: 'New Notification',
        message: 'You have a new notification',
        type: 'booking_confirmed',
      };

      // Setup the subscription
      NotificationService.subscribeToUserNotifications('user-123', mockCallback);

      // Get the callback passed to channel.on
      const channelCallback = mockChannel.on.mock.calls[0][2];
      
      // Simulate new notification
      channelCallback({ new: mockNotification });

      expect(mockCallback).toHaveBeenCalledWith(mockNotification);
      expect(Alert.alert).toHaveBeenCalledWith(
        'New Notification',
        'You have a new notification',
        [{ text: 'OK', style: 'default' }]
      );
    });
  });

  describe('handleAuctionEvent', () => {
    const mockAuction = {
      id: 'auction-123',
      starting_price: 50,
      time_slots: { handyman_id: 'handyman-123' },
    };

    beforeEach(() => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockAuction,
        error: null,
      });
    });

    it('should handle auction started event', async () => {
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.handleAuctionEvent('auction-123', 'started');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'handyman-123',
        'auction_started',
        'Auction Started!',
        'Multiple customers are bidding for your time slot. Starting bid: $50.00',
        { auctionId: 'auction-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle new bid event', async () => {
      const mockBids = [
        { customer_id: 'customer-2', bid_amount: 60 }, // Latest bid
        { customer_id: 'customer-1', bid_amount: 55 }, // Previous bid
      ];

      mockSupabaseChain.order.mockResolvedValueOnce({
        data: mockBids,
        error: null,
      });

      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.handleAuctionEvent('auction-123', 'new_bid');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-1',
        'outbid',
        'You\'ve been outbid!',
        'Someone placed a higher bid of $60.00. Place a new bid to stay in the auction.',
        { auctionId: 'auction-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle auction ended event', async () => {
      const mockFinalBids = [
        { customer_id: 'customer-1', bid_amount: 70 }, // Winner
        { customer_id: 'customer-2', bid_amount: 65 }, // Loser
      ];

      mockSupabaseChain.order.mockResolvedValueOnce({
        data: mockFinalBids,
        error: null,
      });

      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.handleAuctionEvent('auction-123', 'ended');

      // Check winner notification
      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-1',
        'auction_won',
        'Congratulations! You won the auction!',
        'You won the auction with a bid of $70.00. Your booking has been confirmed.',
        { auctionId: 'auction-123' }
      );

      // Check loser notification
      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-2',
        'auction_lost',
        'Auction ended',
        'The auction ended. The winning bid was $70.00. Better luck next time!',
        { auctionId: 'auction-123' }
      );

      // Check handyman notification
      expect(createNotificationSpy).toHaveBeenCalledWith(
        'handyman-123',
        'auction_won',
        'Auction completed!',
        'Your auction ended with a winning bid of $70.00. The booking has been confirmed.',
        { auctionId: 'auction-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle auction fetch error', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Auction not found' },
      });

      // Should not throw error
      await expect(NotificationService.handleAuctionEvent('invalid-auction', 'started'))
        .resolves.not.toThrow();
    });
  });

  describe('notifyBookingEvent', () => {
    const mockBooking = {
      id: 'booking-123',
      customer_id: 'customer-123',
      final_price: 75,
      time_slots: {
        handyman_id: 'handyman-123',
        start_time: '2024-01-01T10:00:00Z',
        duration: 2,
      },
    };

    beforeEach(() => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockBooking,
        error: null,
      });
    });

    it('should handle booking created event', async () => {
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.notifyBookingEvent('booking-123', 'created');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'handyman-123',
        'booking_confirmed',
        'New Booking Request',
        'You have a new booking request for $75.00. Please confirm or decline.',
        { bookingId: 'booking-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle booking confirmed event', async () => {
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.notifyBookingEvent('booking-123', 'confirmed');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-123',
        'booking_confirmed',
        'Booking Confirmed!',
        'Your booking has been confirmed by the handyman. Get ready for your appointment!',
        { bookingId: 'booking-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle booking cancelled event', async () => {
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.notifyBookingEvent('booking-123', 'cancelled');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-123',
        'booking_cancelled',
        'Booking Cancelled',
        'Unfortunately, your booking has been cancelled. You can browse for other available slots.',
        { bookingId: 'booking-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle booking completed event', async () => {
      const createNotificationSpy = jest.spyOn(NotificationService, 'createNotification')
        .mockResolvedValue(true);

      await NotificationService.notifyBookingEvent('booking-123', 'completed');

      expect(createNotificationSpy).toHaveBeenCalledWith(
        'customer-123',
        'booking_confirmed',
        'Job Completed!',
        'Your job has been marked as completed. Thank you for using Worky!',
        { bookingId: 'booking-123' }
      );

      createNotificationSpy.mockRestore();
    });

    it('should handle booking fetch error', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Booking not found' },
      });

      // Should not throw error
      await expect(NotificationService.notifyBookingEvent('invalid-booking', 'created'))
        .resolves.not.toThrow();
    });
  });
});