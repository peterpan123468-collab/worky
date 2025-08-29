import { supabase } from './supabase';

export interface Auction {
  id: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  starting_price: number;
  current_bid: number;
  winning_customer_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  time_slots?: {
    start_time: string;
    duration: number;
    handyman_id: string;
    users?: {
      handyman_profiles?: {
        business_name: string;
        location: string;
      };
    };
  };
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  customer_id: string;
  bid_amount: number;
  created_at: string;
  users?: {
    email: string;
  };
}

export class AuctionService {
  
  /**
   * Get active auctions for customers to participate in
   */
  static async getActiveAuctions(): Promise<Auction[]> {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          time_slots (
            start_time,
            duration,
            handyman_id,
            users!time_slots_handyman_id_fkey (
              handyman_profiles (
                business_name,
                location
              )
            )
          )
        `)
        .eq('status', 'active')
        .gte('end_time', new Date().toISOString())
        .order('end_time', { ascending: true });

      if (error) {
        console.error('Error fetching active auctions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveAuctions:', error);
      return [];
    }
  }

  /**
   * Get auction details with current bids
   */
  static async getAuctionDetails(auctionId: string): Promise<{
    auction: Auction | null;
    bids: AuctionBid[];
  }> {
    try {
      // Get auction details
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select(`
          *,
          time_slots (
            start_time,
            duration,
            handyman_id,
            users!time_slots_handyman_id_fkey (
              handyman_profiles (
                business_name,
                location
              )
            )
          )
        `)
        .eq('id', auctionId)
        .single();

      // Get bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('auction_bids')
        .select(`
          *,
          users (
            email
          )
        `)
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false });

      if (auctionError || bidsError) {
        console.error('Error fetching auction details:', auctionError || bidsError);
        return { auction: null, bids: [] };
      }

      return {
        auction: auctionData,
        bids: bidsData || []
      };
    } catch (error) {
      console.error('Error in getAuctionDetails:', error);
      return { auction: null, bids: [] };
    }
  }

  /**
   * Place a bid in an auction
   */
  static async placeBid(auctionId: string, customerId: string, bidAmount: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate auction is still active
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('status, end_time, current_bid')
        .eq('id', auctionId)
        .single();

      if (auctionError || !auction) {
        return { success: false, error: 'Auction not found' };
      }

      if (auction.status !== 'active') {
        return { success: false, error: 'Auction is no longer active' };
      }

      if (new Date() > new Date(auction.end_time)) {
        return { success: false, error: 'Auction has ended' };
      }

      if (bidAmount <= auction.current_bid) {
        return { 
          success: false, 
          error: `Bid must be higher than current bid of $${auction.current_bid.toFixed(2)}` 
        };
      }

      // Place the bid
      const { error: bidError } = await supabase
        .from('auction_bids')
        .insert([{
          auction_id: auctionId,
          customer_id: customerId,
          bid_amount: bidAmount,
        }]);

      if (bidError) {
        console.error('Error placing bid:', bidError);
        return { success: false, error: 'Failed to place bid' };
      }

      // Update auction current bid
      const { error: updateError } = await supabase
        .from('auctions')
        .update({ current_bid: bidAmount })
        .eq('id', auctionId);

      if (updateError) {
        console.error('Error updating auction:', updateError);
        // Bid was placed but auction wasn't updated - this is still a success
      }

      return { success: true };

    } catch (error) {
      console.error('Error in placeBid:', error);
      return { success: false, error: 'Failed to place bid' };
    }
  }

  /**
   * Get user's bids for a specific auction
   */
  static async getUserBids(auctionId: string, userId: string): Promise<AuctionBid[]> {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bids:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserBids:', error);
      return [];
    }
  }

  /**
   * Complete an auction (usually called by a scheduled job)
   */
  static async completeAuction(auctionId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase.rpc('complete_auction', {
        auction_id_param: auctionId
      });

      if (error) {
        console.error('Error completing auction:', error);
        return { success: false, error: 'Failed to complete auction' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in completeAuction:', error);
      return { success: false, error: 'Failed to complete auction' };
    }
  }

  /**
   * Calculate time remaining in auction
   */
  static getTimeRemaining(endTime: string): {
    total: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const total = Math.max(0, end - now);

    return {
      total,
      minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((total % (1000 * 60)) / 1000),
      isExpired: total <= 0,
    };
  }

  /**
   * Subscribe to auction updates
   */
  static subscribeToAuction(auctionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`auction_${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to all active auctions
   */
  static subscribeToActiveAuctions(callback: (payload: any) => void) {
    return supabase
      .channel('active_auctions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auctions',
        },
        callback
      )
      .subscribe();
  }
}