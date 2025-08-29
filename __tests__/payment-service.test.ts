import { PaymentService } from '../lib/payment-service';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock Stripe (since we don't have actual Stripe in demo mode)
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    confirm: jest.fn(),
    retrieve: jest.fn(),
  },
  transfers: {
    create: jest.fn(),
  },
};

describe('PaymentService', () => {
  const mockSupabaseChain = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default Supabase mock chain
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.insert.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.update.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.single.mockReturnValue(mockSupabaseChain);
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        final_price: 50.00,
        customer_id: 'customer-123',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockBooking,
        error: null,
      });

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { id: 'pi_123', client_secret: 'pi_123_secret' },
        error: null,
      });

      const result = await PaymentService.createPaymentIntent('booking-123');

      expect(result.success).toBe(true);
      expect(result.paymentIntent).toEqual({
        id: 'pi_123',
        client_secret: 'pi_123_secret',
      });
      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(supabase.from).toHaveBeenCalledWith('payment_intents');
    });

    it('should handle booking not found error', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Booking not found' },
      });

      const result = await PaymentService.createPaymentIntent('invalid-booking');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });

    it('should handle payment intent creation failure', async () => {
      const mockBooking = {
        id: 'booking-123',
        final_price: 50.00,
        customer_id: 'customer-123',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockBooking,
        error: null,
      });

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment creation failed' },
      });

      const result = await PaymentService.createPaymentIntent('booking-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment creation failed');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: 'pi_123',
          status: 'succeeded',
          amount: 5000,
        },
        error: null,
      });

      const result = await PaymentService.confirmPayment('pi_123');

      expect(result.success).toBe(true);
      expect(result.paymentIntent.status).toBe('succeeded');
      expect(supabase.from).toHaveBeenCalledWith('payment_intents');
    });

    it('should handle payment confirmation failure', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment not found' },
      });

      const result = await PaymentService.confirmPayment('invalid-pi');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        booking_id: 'booking-123',
        amount: 5000,
        status: 'succeeded',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockPaymentIntent,
        error: null,
      });

      // Mock successful refund update
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: { ...mockPaymentIntent, status: 'refunded' },
        error: null,
      });

      const result = await PaymentService.processRefund('pi_123', 2500, 'Customer cancellation');

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('payment_intents');
    });

    it('should handle invalid refund amount', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        booking_id: 'booking-123',
        amount: 5000,
        status: 'succeeded',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await PaymentService.processRefund('pi_123', 6000, 'Invalid amount');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund amount exceeds payment amount');
    });

    it('should handle already refunded payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        booking_id: 'booking-123',
        amount: 5000,
        status: 'refunded',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await PaymentService.processRefund('pi_123', 2500, 'Already refunded');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment has already been refunded');
    });
  });

  describe('calculatePlatformFee', () => {
    it('should calculate platform fee correctly', () => {
      expect(PaymentService.calculatePlatformFee(100)).toBe(10); // 10%
      expect(PaymentService.calculatePlatformFee(50)).toBe(5);   // 10%
      expect(PaymentService.calculatePlatformFee(0)).toBe(0);    // 0%
    });

    it('should handle edge cases', () => {
      expect(PaymentService.calculatePlatformFee(-10)).toBe(0);  // Negative amount
      expect(PaymentService.calculatePlatformFee(1000)).toBe(100); // Large amount
    });
  });

  describe('getPaymentHistory', () => {
    it('should fetch payment history successfully', async () => {
      const mockPayments = [
        {
          id: 'pi_123',
          amount: 5000,
          status: 'succeeded',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'pi_456',
          amount: 3000,
          status: 'succeeded',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: mockPayments,
        error: null,
      });

      const result = await PaymentService.getPaymentHistory('booking-123');

      expect(result.success).toBe(true);
      expect(result.payments).toEqual(mockPayments);
      expect(supabase.from).toHaveBeenCalledWith('payment_intents');
    });

    it('should handle database error', async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await PaymentService.getPaymentHistory('booking-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('processPayout', () => {
    it('should process payout successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        final_price: 100,
        time_slots: { handyman_id: 'handyman-123' },
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockBooking,
        error: null,
      });

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: {
          id: 'payout-123',
          amount: 90,
          platform_fee: 10,
          status: 'completed',
        },
        error: null,
      });

      const result = await PaymentService.processPayout('booking-123');

      expect(result.success).toBe(true);
      expect(result.payout.amount).toBe(90);
      expect(result.payout.platform_fee).toBe(10);
    });

    it('should handle booking not found', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Booking not found' },
      });

      const result = await PaymentService.processPayout('invalid-booking');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });
  });

  describe('getPaymentStatus', () => {
    it('should get payment status successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        status: 'succeeded',
        amount: 5000,
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseChain.single.mockResolvedValueOnce({
        data: mockPaymentIntent,
        error: null,
      });

      const result = await PaymentService.getPaymentStatus('pi_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.paymentIntent).toEqual(mockPaymentIntent);
    });

    it('should handle payment not found', async () => {
      mockSupabaseChain.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Payment not found' },
      });

      const result = await PaymentService.getPaymentStatus('invalid-pi');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });
  });
});