import { Alert } from 'react-native';
import { supabase } from './supabase';

// Note: This is a demo implementation
// In production, you would need a backend server to securely handle Stripe operations

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export class PaymentService {
  
  /**
   * Initialize Stripe (would be called in app startup)
   */
  static async initializeStripe(): Promise<boolean> {
    try {
      // In a real app, you would initialize Stripe here
      console.log('Stripe initialized (demo mode)');
      return true;
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      return false;
    }
  }

  /**
   * Create payment intent for booking
   */
  static async createPaymentIntent(
    bookingId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<PaymentIntent | null> {
    try {
      // In production, this would call your backend API
      // For demo purposes, we'll create a mock payment intent
      const mockPaymentIntent: PaymentIntent = {
        id: `pi_demo_${Date.now()}`,
        client_secret: `pi_demo_${Date.now()}_secret`,
        amount: amount * 100, // Stripe uses cents
        currency,
        status: 'requires_payment_method',
      };

      // Store payment intent in database
      const { error } = await supabase
        .from('payment_intents')
        .insert([{
          id: mockPaymentIntent.id,
          booking_id: bookingId,
          amount: mockPaymentIntent.amount,
          currency: mockPaymentIntent.currency,
          status: mockPaymentIntent.status,
          client_secret: mockPaymentIntent.client_secret,
        }]);

      if (error) {
        console.error('Error storing payment intent:', error);
        return null;
      }

      return mockPaymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }

  /**
   * Process payment (demo implementation)
   */
  static async processPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would use Stripe's SDK to confirm payment
      // For demo purposes, we'll simulate a successful payment
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      // Update payment intent status
      const { error } = await supabase
        .from('payment_intents')
        .update({
          status: 'succeeded',
          payment_method_id: paymentMethodId,
          processed_at: new Date().toISOString(),
        })
        .eq('id', paymentIntentId);

      if (error) {
        console.error('Error updating payment intent:', error);
        return { success: false, error: 'Failed to update payment status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Create demo payment method (for testing)
   */
  static async createDemoPaymentMethod(): Promise<PaymentMethod> {
    return {
      id: `pm_demo_${Date.now()}`,
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: new Date().getFullYear() + 3,
      },
    };
  }

  /**
   * Handle booking payment
   */
  static async processBookingPayment(
    bookingId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(bookingId, amount);
      if (!paymentIntent) {
        return { success: false, error: 'Failed to create payment intent' };
      }

      // In a real app, you would show payment sheet here
      // For demo, we'll simulate successful payment
      const demoPaymentMethod = await this.createDemoPaymentMethod();
      
      Alert.alert(
        'Demo Payment',
        `This is a demo payment of $${amount.toFixed(2)}\\n\\nIn production, you would enter your card details here.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay Demo',
            onPress: async () => {
              const result = await this.processPayment(paymentIntent.id, demoPaymentMethod.id);
              if (result.success) {
                // Update booking status
                await supabase
                  .from('bookings')
                  .update({ status: 'confirmed', payment_status: 'paid' })
                  .eq('id', bookingId);
                
                Alert.alert('Payment Successful!', 'Your booking has been confirmed and paid.');
              } else {
                Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
              }
            },
          },
        ]
      );

      return { success: true };
    } catch (error) {
      console.error('Error processing booking payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  /**
   * Handle auction payment (for winning bid)
   */
  static async processAuctionPayment(
    auctionId: string,
    bidAmount: number,
    customerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get or create booking for auction winner
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', customerId)
        .eq('final_price', bidAmount)
        .single();

      if (bookingError || !booking) {
        return { success: false, error: 'Booking not found' };
      }

      return await this.processBookingPayment(booking.id, bidAmount);
    } catch (error) {
      console.error('Error processing auction payment:', error);
      return { success: false, error: 'Auction payment failed' };
    }
  }

  /**
   * Get payment history for user
   */
  static async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payment_intents')
        .select(`
          *,
          bookings (
            final_price,
            time_slots (
              start_time,
              duration
            )
          )
        `)
        .eq('bookings.customer_id', userId)
        .eq('status', 'succeeded')
        .order('processed_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return [];
    }
  }

  /**
   * Process payout to handyman (would be handled by backend in production)
   */
  static async processPayout(
    handymanId: string,
    amount: number,
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, this would use Stripe Connect to pay handymen
      // For demo purposes, we'll just record the payout
      
      const { error } = await supabase
        .from('payouts')
        .insert([{
          handyman_id: handymanId,
          booking_id: bookingId,
          amount: amount * 0.85, // 15% platform fee
          status: 'completed',
          processed_at: new Date().toISOString(),
        }]);

      if (error) {
        console.error('Error recording payout:', error);
        return { success: false, error: 'Failed to process payout' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing payout:', error);
      return { success: false, error: 'Payout processing failed' };
    }
  }

  /**
   * Get platform fee percentage
   */
  static getPlatformFeePercentage(): number {
    return 0.15; // 15% platform fee
  }

  /**
   * Calculate platform fee
   */
  static calculatePlatformFee(amount: number): number {
    return amount * this.getPlatformFeePercentage();
  }

  /**
   * Calculate handyman payout (after platform fee)
   */
  static calculateHandymanPayout(amount: number): number {
    return amount * (1 - this.getPlatformFeePercentage());
  }
}