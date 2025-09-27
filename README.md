# Worky Mobile App

A React Native mobile application implementing the user journeys for the Worky handyman marketplace platform.

## Overview

This mobile app provides a native experience for both handymen and customers to interact with the Worky platform. It implements the core user journeys outlined in the project documentation, including:

- **Handyman Features**: Profile management, availability setting, auction creation, earnings tracking
- **Customer Features**: Service discovery, instant booking, auction participation, booking management

## User Types

### Handyman
- Service providers who list availability and create auctions
- Manage business profile, skills, and hourly rates
- Create auctions for premium time slots
- Track earnings and manage bookings

### Customer
- Users who need immediate help with urgent tasks
- Browse and book available time slots
- Participate in auctions for premium services
- Manage bookings and rate service providers

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **NativeWind** for styling (Tailwind CSS for React Native)
- **React Context** for state management

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Input, Card, etc.)
│   └── auth/         # Authentication-specific components
├── screens/          # Main app screens
├── navigation/       # Navigation configuration
├── contexts/         # React Context providers
├── types/           # TypeScript type definitions
├── lib/             # Utility functions
└── hooks/           # Custom React hooks
```

## Key Features Implemented

### Authentication Flow
- Welcome screen with user type selection
- Separate authentication flows for handyman and customer
- Social login options (Google, Apple)
- Form validation and error handling

### User Dashboards
- **Handyman Dashboard**: Stats, quick actions, recent activity, active auctions
- **Customer Dashboard**: Service search, available services, live auctions, booking management

### Styling System
- Ported shadcn/ui design system to React Native
- Consistent color scheme and typography
- Responsive design patterns
- Dark/light mode support

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your preferred platform:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   npm run web    # Web browser
   ```

## User Journey Implementation

The app implements the complete user journeys as documented:

1. **Welcome Screen**: User type selection (Handyman vs Customer)
2. **Authentication**: Sign up/Sign in with role-specific flows
3. **Dashboard**: Role-specific dashboards with relevant features
4. **Navigation**: Seamless flow between screens

## Future Enhancements

- Real-time auction bidding interface
- Calendar integration for availability management
- Push notifications for auction updates
- Payment integration
- Advanced search and filtering
- Rating and review system

## Design System

The app uses a consistent design system based on shadcn/ui principles:

- **Colors**: Semantic color tokens for backgrounds, text, borders
- **Typography**: Space Grotesk font family
- **Components**: Reusable UI components with consistent styling
- **Layout**: Responsive design patterns

## Contributing

This mobile app is part of the larger Worky platform ecosystem. When making changes:

1. Follow the established component patterns
2. Maintain type safety with TypeScript
3. Use the design system consistently
4. Test on both iOS and Android platforms
