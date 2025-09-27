import { supabase } from '../lib/supabase'

class AuctionLifecycleService {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly CHECK_INTERVAL = 60 * 1000 // 1 minute

  /**
   * Start the auction lifecycle management service
   * This will periodically check for expired auctions and close them
   */
  start() {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Start the periodic check
    this.intervalId = setInterval(async () => {
      try {
        await this.processExpiredAuctions()
      } catch (error) {
        console.error('Error processing expired auctions:', error)
      }
    }, this.CHECK_INTERVAL)

    console.log('Auction lifecycle service started')
  }

  /**
   * Stop the auction lifecycle management service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Auction lifecycle service stopped')
    }
  }

  /**
   * Process expired auctions by calling the database function
   */
  async processExpiredAuctions() {
    try {
      console.log('Processing expired auctions...')
      
      const { data, error } = await supabase.rpc('close_expired_auctions')
      
      if (error) {
        console.error('Error calling close_expired_auctions:', error)
        return
      }
      
      console.log('Expired auctions processed successfully')
    } catch (error) {
      console.error('Error processing expired auctions:', error)
    }
  }

  /**
   * Process a specific auction immediately (for testing or manual triggering)
   */
  async processAuctionImmediately(auctionId: string) {
    try {
      // This would be used for immediate processing of a specific auction
      // We'd need to modify the database function to accept a specific auction ID
      console.log(`Processing auction ${auctionId} immediately...`)
      
      // For now, we'll just run the general function
      await this.processExpiredAuctions()
    } catch (error) {
      console.error(`Error processing auction ${auctionId} immediately:`, error)
    }
  }
}

export const auctionLifecycleService = new AuctionLifecycleService()