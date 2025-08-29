import { AuctionService } from '../lib/auction-service';
import { NotificationService } from '../lib/notification-service';
import { PaymentService } from '../lib/payment-service';
import { supabase } from '../lib/supabase';

// Mock dependencies
jest.mock('../lib/supabase');
jest.mock('react-native', () => ({ Alert: { alert: jest.fn() } }));

describe('Integration Tests: Auction and Payment Flows', () => {
  const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
    rpc: jest.fn(),
  };

  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (supabase.rpc as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  describe('Complete Auction Flow', () => {
    it('should handle auction lifecycle with payment', async () => {
      const auctionId = 'auction-123';
      const customerId = 'customer-123';
      const bookingId = 'booking-123';

      // Step 1: Get auctions
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: [{ id: auctionId, current_bid: 50, status: 'active' }],
        error: null,
      });

      const auctions = await AuctionService.getActiveAuctions();
      expect(auctions).toHaveLength(1);

      // Step 2: Place bid
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: 'bid-1', customer_id: customerId, bid_amount: 55 },
        error: null,
      });

      const bidResult = await AuctionService.placeBid(auctionId, customerId, 55);
      expect(bidResult.success).toBe(true);

      // Step 3: Complete auction
      mockSupabaseChain.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const completeResult = await AuctionService.completeAuction(auctionId);
      expect(completeResult.success).toBe(true);

      // Step 4: Create payment
      mockSupabaseChain.single
        .mockResolvedValueOnce({ 
          data: { id: bookingId, final_price: 55, customer_id: customerId }, 
          error: null 
        })
        .mockResolvedValueOnce({
          data: { id: 'pi_123', client_secret: 'secret', status: 'requires_confirmation' },
          error: null,
        });

      const paymentResult = await PaymentService.createPaymentIntent(bookingId);
      expect(paymentResult.success).toBe(true);

      // Step 5: Confirm payment
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: 'pi_123', status: 'succeeded' },
        error: null,
      });

      const confirmResult = await PaymentService.confirmPayment('pi_123');
      expect(confirmResult.success).toBe(true);
    });
  });

  describe('Payment Integration', () => {
    it('should handle payment and refund flow', async () => {
      const paymentId = 'pi_456';
      const bookingId = 'booking-456';

      // Create payment
      mockSupabaseChain.single
        .mockResolvedValueOnce({ 
          data: { id: bookingId, final_price: 100 }, 
          error: null 
        })
        .mockResolvedValueOnce({
          data: { id: paymentId, status: 'succeeded', amount: 10000 },
          error: null,
        });

      const paymentResult = await PaymentService.createPaymentIntent(bookingId);
      expect(paymentResult.success).toBe(true);

      // Process refund
      mockSupabaseChain.single
        .mockResolvedValueOnce({
          data: { id: paymentId, amount: 10000, status: 'succeeded' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: paymentId, status: 'refunded' },
          error: null,
        });

      const refundResult = await PaymentService.processRefund(paymentId, 5000, 'Test refund');
      expect(refundResult.success).toBe(true);
    });
  });

  describe('Notification Integration', () => {
    it('should handle auction notifications', async () => {
      const auctionId = 'auction-notify';
      const handymanId = 'handyman-123';

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { 
          id: auctionId, 
          starting_price: 60,
          time_slots: { handyman_id: handymanId }
        },
        error: null,
      });

      mockSupabaseChain.insert.mockResolvedValueOnce({
        data: [{ id: 'notif-1' }],
        error: null,
      });

      await NotificationService.handleAuctionEvent(auctionId, 'started');
      
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith([{
        user_id: handymanId,
        type: 'auction_started',
        title: 'Auction Started!',
        message: 'Multiple customers are bidding for your time slot. Starting bid: $60.00',
        data: { auctionId },
        read: false,
      }]);
    });

    it('should setup real-time subscriptions', () => {
      const userId = 'user-123';
      const callback = jest.fn();

      NotificationService.subscribeToUserNotifications(userId, callback);

      expect(supabase.channel).toHaveBeenCalledWith(`user_notifications_${userId}`);
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseChain.eq.mockRejectedValue(new Error('Network error'));

      const result = await AuctionService.getActiveAuctions();
      expect(result).toEqual([]);
    });

    it('should handle invalid bid amounts', async () => {
      const result = await AuctionService.placeBid('auction-1', 'customer-1', -10);
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be positive');
    });

    it('should handle payment errors', async () => {
      mockSupabaseChain.single.mockRejectedValue(new Error('Payment service error'));

      const result = await PaymentService.createPaymentIntent('booking-1');
      expect(result.success).toBe(false);
    });
  });
});