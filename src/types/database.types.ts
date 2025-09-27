// =============================================
// Database Types - Generated from schema.sql
// =============================================

// Enum types
export type UserType = 'handyman' | 'customer'
export type SlotStatus = 'open' | 'booked' | 'auction' | 'canceled'
export type BookingType = 'calendar' | 'auction' | 'both'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'canceled'
export type AuctionStatus = 'active' | 'ended' | 'cancelled'
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
export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'other'

// Database interface following Supabase pattern
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          user_type: UserType
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          user_type: UserType
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: UserType
          updated_at?: string
        }
      }
      handyman_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          hourly_rate: number
          region: string
          skills: string[]
          description: string | null
          phone: string | null
          default_auction_duration: number | null
          min_bid_increment: number | null
          calendar_integration_enabled: boolean | null
          auto_confirm_calendar_bookings: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          hourly_rate: number
          region: string
          skills: string[]
          description?: string | null
          phone?: string | null
          default_auction_duration?: number | null
          min_bid_increment?: number | null
          calendar_integration_enabled?: boolean | null
          auto_confirm_calendar_bookings?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          hourly_rate?: number
          region?: string
          skills?: string[]
          description?: string | null
          phone?: string | null
          default_auction_duration?: number | null
          min_bid_increment?: number | null
          calendar_integration_enabled?: boolean | null
          auto_confirm_calendar_bookings?: boolean | null
          updated_at?: string
        }
      }
      time_slots: {
        Row: {
          id: string
          handyman_id: string
          start_time: string
          end_time: string
          status: SlotStatus | null
          calendar_event_id: string | null
          is_synced_to_calendar: boolean | null
          booking_type: BookingType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handyman_id: string
          start_time: string
          end_time: string
          status?: SlotStatus | null
          calendar_event_id?: string | null
          is_synced_to_calendar?: boolean | null
          booking_type?: BookingType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handyman_id?: string
          start_time?: string
          end_time?: string
          status?: SlotStatus | null
          calendar_event_id?: string | null
          is_synced_to_calendar?: boolean | null
          booking_type?: BookingType | null
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          slot_id: string | null
          customer_id: string
          handyman_id: string
          status: BookingStatus | null
          total_price: number
          work_description: string | null
          customer_address: string
          booking_type: BookingType | null
          auction_id: string | null
          winning_bid_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slot_id?: string | null
          customer_id: string
          handyman_id: string
          status?: BookingStatus | null
          total_price: number
          work_description?: string | null
          customer_address: string
          booking_type?: BookingType | null
          auction_id?: string | null
          winning_bid_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slot_id?: string | null
          customer_id?: string
          handyman_id?: string
          status?: BookingStatus | null
          total_price?: number
          work_description?: string | null
          customer_address?: string
          booking_type?: BookingType | null
          auction_id?: string | null
          winning_bid_amount?: number | null
          updated_at?: string
        }
      }
      auctions: {
        Row: {
          id: string
          handyman_id: string
          title: string
          description: string | null
          service_type: string
          region: string
          start_time: string
          end_time: string
          starting_price: number
          reserve_price: number | null
          current_highest_bid: number | null
          current_highest_bidder_id: string | null
          bid_increment: number | null
          ends_at: string
          status: AuctionStatus | null
          winner_id: string | null
          auto_extend: boolean | null
          auto_extend_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handyman_id: string
          title: string
          description?: string | null
          service_type: string
          region: string
          start_time: string
          end_time: string
          starting_price: number
          reserve_price?: number | null
          current_highest_bid?: number | null
          current_highest_bidder_id?: string | null
          bid_increment?: number | null
          ends_at: string
          status?: AuctionStatus | null
          winner_id?: string | null
          auto_extend?: boolean | null
          auto_extend_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handyman_id?: string
          title?: string
          description?: string | null
          service_type?: string
          region?: string
          start_time?: string
          end_time?: string
          starting_price?: number
          reserve_price?: number | null
          current_highest_bid?: number | null
          current_highest_bidder_id?: string | null
          bid_increment?: number | null
          ends_at?: string
          status?: AuctionStatus | null
          winner_id?: string | null
          auto_extend?: boolean | null
          auto_extend_minutes?: number | null
          updated_at?: string
        }
      }
      auction_bids: {
        Row: {
          id: string
          auction_id: string
          bidder_id: string
          bid_amount: number
          bid_time: string | null
          is_winning_bid: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          auction_id: string
          bidder_id: string
          bid_amount: number
          bid_time?: string | null
          is_winning_bid?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          auction_id?: string
          bidder_id?: string
          bid_amount?: number
          bid_time?: string | null
          is_winning_bid?: boolean | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data: any | null // JSONB
          read_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          message: string
          data?: any | null
          read_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          message?: string
          data?: any | null
          read_at?: string | null
          expires_at?: string | null
        }
      }
      calendar_integrations: {
        Row: {
          id: string
          handyman_id: string
          calendar_provider: CalendarProvider
          external_calendar_id: string
          calendar_name: string | null
          access_token_encrypted: string | null
          refresh_token_encrypted: string | null
          sync_enabled: boolean | null
          last_sync_at: string | null
          sync_frequency_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          handyman_id: string
          calendar_provider: CalendarProvider
          external_calendar_id: string
          calendar_name?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          last_sync_at?: string | null
          sync_frequency_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          handyman_id?: string
          calendar_provider?: CalendarProvider
          external_calendar_id?: string
          calendar_name?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          last_sync_at?: string | null
          sync_frequency_minutes?: number | null
          updated_at?: string
        }
      }
    }
    Functions: {
      place_auction_bid: {
        Args: {
          p_auction_id: string
          p_bidder_id: string
          p_bid_amount: number
          p_max_auto_bid?: number
        }
        Returns: {
          success: boolean
          error?: string
          bid_id?: string
          new_highest_bid?: number
        }
      }
      close_expired_auctions: {
        Args: {}
        Returns: {
          processed_count: number
        }
      }
    }
  }
}

// Convenience type exports for easier usage
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type HandymanProfile = Database['public']['Tables']['handyman_profiles']['Row']
export type HandymanProfileInsert = Database['public']['Tables']['handyman_profiles']['Insert']
export type HandymanProfileUpdate = Database['public']['Tables']['handyman_profiles']['Update']

export type TimeSlot = Database['public']['Tables']['time_slots']['Row']
export type TimeSlotInsert = Database['public']['Tables']['time_slots']['Insert']
export type TimeSlotUpdate = Database['public']['Tables']['time_slots']['Update']

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export type Auction = Database['public']['Tables']['auctions']['Row']
export type AuctionInsert = Database['public']['Tables']['auctions']['Insert']
export type AuctionUpdate = Database['public']['Tables']['auctions']['Update']

export type AuctionBid = Database['public']['Tables']['auction_bids']['Row']
export type AuctionBidInsert = Database['public']['Tables']['auction_bids']['Insert']
export type AuctionBidUpdate = Database['public']['Tables']['auction_bids']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type CalendarIntegration = Database['public']['Tables']['calendar_integrations']['Row']
export type CalendarIntegrationInsert = Database['public']['Tables']['calendar_integrations']['Insert']
export type CalendarIntegrationUpdate = Database['public']['Tables']['calendar_integrations']['Update']