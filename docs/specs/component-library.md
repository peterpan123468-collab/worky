# Worky Component Library

This document provides comprehensive documentation for all reusable UI components in the Worky mobile app, including props, usage examples, and styling guidelines.

## Table of Contents
1. [UI Components](#ui-components)
2. [Auction Components](#auction-components)
3. [Form Components](#form-components)
4. [Layout Components](#layout-components)
5. [Styling Guidelines](#styling-guidelines)

## UI Components

### Button
A versatile button component with multiple variants.

**Props:**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { Button } from '../components/ui/button';

// Primary button
<Button onPress={handlePress}>Create Auction</Button>

// Secondary button
<Button variant="secondary" onPress={handlePress}>Cancel</Button>

// Outline button
<Button variant="outline" onPress={handlePress}>View Details</Button>
```

### Card
A container component for grouping related content.

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { Card, CardContent, CardHeader } from '../components/ui/card';

<Card>
  <CardHeader>
    <Text>Auction Details</Text>
  </CardHeader>
  <CardContent>
    <Text>Content goes here</Text>
  </CardContent>
</Card>
```

### Input
A text input component with validation support.

**Props:**
```typescript
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  secureTextEntry?: boolean;
  error?: string;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { Input } from '../components/ui/input';

<Input
  value={email}
  onChangeText={setEmail}
  placeholder="Enter your email"
  keyboardType="email-address"
/>
```

## Auction Components

### AuctionCard
Displays auction information in a card format.

**Props:**
```typescript
interface AuctionCardProps {
  auction: Auction;
  onPress: () => void;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { AuctionCard } from '../components/auction/AuctionCard';

<AuctionCard 
  auction={auctionData} 
  onPress={() => navigateToAuction(auctionData.id)} 
/>
```

### BiddingInterface
Real-time bidding interface for active auctions.

**Props:**
```typescript
interface BiddingInterfaceProps {
  auction: Auction;
  onBid: (amount: number) => void;
  disabled?: boolean;
}
```

**Usage:**
```tsx
import { BiddingInterface } from '../components/auction/BiddingInterface';

<BiddingInterface 
  auction={currentAuction}
  onBid={handlePlaceBid}
  disabled={!isAuctionActive}
/>
```

### AuctionTimer
Countdown timer for auction expiration.

**Props:**
```typescript
interface AuctionTimerProps {
  endTime: string;
  onExpire?: () => void;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { AuctionTimer } from '../components/auction/AuctionTimer';

<AuctionTimer 
  endTime={auction.ends_at}
  onExpire={handleAuctionEnd}
/>
```

### AuctionCreationForm
Multi-step form for creating new auctions.

**Props:**
```typescript
interface AuctionCreationFormProps {
  onSubmit: (data: CreateAuctionPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}
```

**Usage:**
```tsx
import { AuctionCreationForm } from '../components/auction/AuctionCreationForm';

<AuctionCreationForm 
  onSubmit={handleCreateAuction}
  onCancel={handleCancel}
  loading={isCreating}
/>
```

## Form Components

### AuthForm
Authentication form for login and registration.

**Props:**
```typescript
interface AuthFormProps {
  userType: 'handyman' | 'customer';
  onSubmit: (data: AuthFormData) => void;
  loading?: boolean;
}
```

**Usage:**
```tsx
import { AuthForm } from '../components/forms/AuthForm';

<AuthForm 
  userType="handyman"
  onSubmit={handleAuthSubmit}
  loading={isAuthenticating}
/>
```

## Layout Components

### Background
Full-screen background with theme support.

**Props:**
```typescript
interface BackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}
```

**Usage:**
```tsx
import { Background } from '../components/Background';

<Background>
  <DashboardContent />
</Background>
```

## Styling Guidelines

### Color Palette
```typescript
// Primary colors
const colors = {
  primary: '#6366f1',    // Indigo
  secondary: '#8b5cf6',  // Violet
  accent: '#ec4899',     // Pink
  success: '#10b981',    // Emerald
  warning: '#f59e0b',    // Amber
  error: '#ef4444',      // Red
  background: '#0f172a', // Slate
  card: 'rgba(30, 41, 59, 0.7)', // Card background
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)'
};
```

### Typography
```typescript
const typography = {
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  heading2: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff'
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)'
  }
};
```

### Spacing
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

### Border Radius
```typescript
const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999
};
```