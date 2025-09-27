# Worky API Reference

This document provides a complete reference for the Worky mobile app APIs, including both Supabase database functions and client-side service methods.

## Table of Contents
1. [Database Functions](#database-functions)
2. [Client Services](#client-services)
3. [Authentication API](#authentication-api)
4. [Auction API](#auction-api)
5. [Notification API](#notification-api)

## Database Functions

### place_auction_bid()
Places a bid on an active auction with race condition protection.

**Signature:**
```sql
place_auction_bid(
  p_auction_id UUID,
  p_bidder_id UUID,
  p_bid_amount DECIMAL,
  p_max_auto_bid DECIMAL DEFAULT NULL
) RETURNS JSON
```

**Parameters:**
- `p_auction_id`: The ID of the auction to bid on
- `p_bidder_id`: The ID of the user placing the bid
- `p_bid_amount`: The bid amount in CHF
- `p_max_auto_bid`: Optional maximum bid for auto-bidding

**Returns:**
```json
{
  "success": boolean,
  "error": string,
  "bid_id": string,
  "new_highest_bid": decimal
}
```

**Usage Example:**
```javascript
const { data, error } = await supabase.rpc('place_auction_bid', {
  p_auction_id: 'auction-uuid',
  p_bidder_id: 'user-uuid',
  p_bid_amount: 50.00,
  p_max_auto_bid: 100.00
});
```

### close_expired_auctions()
Processes expired auctions and creates bookings for winners.

**Signature:**
```sql
close_expired_auctions() RETURNS void
```

**Usage Example:**
```javascript
const { data, error } = await supabase.rpc('close_expired_auctions');
```

### handle_new_user()
Handles new user registration and creates appropriate profile records.

**Signature:**
```sql
handle_new_user() RETURNS TRIGGER
```

## Client Services

### AuthService
Handles user authentication and profile management.

#### signUp()
```typescript
signUp(data: SignUpData): Promise<AuthResponse>
```

#### signIn()
```typescript
signIn(email: string, password: string): Promise<AuthResponse>
```

#### signOut()
```typescript
signOut(): Promise<{ error: string | null }>
```

#### getCurrentUser()
```typescript
getCurrentUser(): Promise<AuthUser | null>
```

### AuctionService
Manages auction creation, listing, and bidding.

#### createAuction()
```typescript
createAuction(handymanId: string, payload: CreateAuctionPayload): Promise<Auction>
```

#### listAuctions()
```typescript
listAuctions(filters: AuctionFilters = {}): Promise<Auction[]>
```

#### getAuction()
```typescript
getAuction(id: string): Promise<Auction>
```

#### placeBid()
```typescript
placeBid(input: BidInput): Promise<BidResult>
```

### NotificationService
Manages user notifications.

#### createNotification()
```typescript
createNotification(payload: CreateNotificationPayload): Promise<Notification | null>
```

#### getUserNotifications()
```typescript
getUserNotifications(userId: string, limit = 50): Promise<Notification[]>
```

#### markAsRead()
```typescript
markAsRead(notificationId: string): Promise<boolean>
```

## Authentication API

### User Registration
```http
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "user_type": "handyman",
  "business_name": "John's Plumbing", // For handymen
  "hourly_rate": 80 // For handymen
}
```

### User Login
```http
POST /auth/v1/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### User Logout
```http
POST /auth/v1/logout
Authorization: Bearer <access_token>
```

## Auction API

### Create Auction
```http
POST /rest/v1/auctions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "handyman_id": "user-uuid",
  "title": "Emergency Plumbing Repair",
  "description": "Fix leaking pipe in bathroom",
  "service_type": "plumbing",
  "region": "Zurich",
  "start_time": "2025-01-15T09:00:00Z",
  "end_time": "2025-01-15T11:00:00Z",
  "starting_price": 50.00,
  "reserve_price": 100.00
}
```

### List Auctions
```http
GET /rest/v1/auctions?select=*&status=eq.active&order=created_at.desc
Authorization: Bearer <access_token>
```

### Get Auction Details
```http
GET /rest/v1/auctions?id=eq.auction-uuid&select=*
Authorization: Bearer <access_token>
```

### Place Bid
```http
POST /rest/v1/rpc/place_auction_bid
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "p_auction_id": "auction-uuid",
  "p_bidder_id": "user-uuid",
  "p_bid_amount": 75.00
}
```

## Notification API

### Get Notifications
```http
GET /rest/v1/notifications?select=*&user_id=eq.user-uuid&is=read_at.is.null
Authorization: Bearer <access_token>
```

### Mark Notification as Read
```http
PATCH /rest/v1/notifications?id=eq.notification-uuid
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "read_at": "2025-01-15T10:30:00Z"
}
```