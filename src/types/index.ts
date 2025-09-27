export type UserType = 'handyman' | 'customer'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  userType: UserType
  createdAt: Date
  updatedAt: Date
}

export interface HandymanProfile {
  id: string
  userId: string
  businessName: string
  hourlyRate: number
  location: string
  skills: string[]
  description: string
  availability: TimeSlot[]
}

export interface CustomerProfile {
  id: string
  userId: string
  preferences: {
    maxDistance: number
    preferredSkills: string[]
  }
}

export interface TimeSlot {
  id: string
  handymanId: string
  startTime: Date
  endTime: Date
  isAvailable: boolean
  isAuction: boolean
  price?: number
}

export interface Booking {
  id: string
  customerId: string
  handymanId: string
  timeSlotId: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface Auction {
  id: string
  handymanId: string
  timeSlotId: string
  startingPrice: number
  reservePrice?: number
  duration: number // in minutes
  currentBid?: number
  currentBidderId?: string
  status: 'active' | 'ended' | 'cancelled'
  createdAt: Date
  endsAt: Date
}

export interface AuctionBid {
  id: string
  auctionId: string
  customerId: string
  amount: number
  createdAt: Date
}
