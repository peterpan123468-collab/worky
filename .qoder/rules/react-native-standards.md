# React Native & TypeScript Standards

## Component Structure
```typescript
// Standard component template
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Card, CardHeader, CardContent } from '../ui/card'
import { glassCard } from '../themeStyles'

interface ComponentProps {
  title: string
  theme?: 'light' | 'dark' | 'glass'
}

export const ComponentName: React.FC<ComponentProps> = ({ 
  title, 
  theme = 'light' 
}) => {
  return (
    <Card style={[styles.container, theme === 'glass' && glassCard]}>
      <CardHeader>
        <Text style={styles.title}>{title}</Text>
      </CardHeader>
      <CardContent>
        {/* Content here */}
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
})
```

## TypeScript Rules
- Use strict mode: `"strict": true`
- No `any` types - use proper typing
- Export interfaces for props
- Use generics for reusable components
- Define union types for theme/status values

## Import Organization
```typescript
// 1. React and React Native
import React from 'react'
import { View, Text } from 'react-native'

// 2. Third-party libraries
import { useNavigation } from '@react-navigation/native'

// 3. Local components
import { Card } from '../ui/card'

// 4. Services and utilities
import { formatCurrency } from '../../utils/currency'

// 5. Types
import type { AuctionType } from '../../types/auction'
```

## Hooks Pattern
```typescript
// Custom hook template
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuctionData = (auctionId: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Implementation
  }, [auctionId])

  return { data, loading, error }
}
```

## Service Layer Pattern
```typescript
// Service template
import { supabase } from '../lib/supabase'
import type { AuctionType } from '../types/auction'

export class AuctionService {
  static async createAuction(data: Partial<AuctionType>) {
    const { data: auction, error } = await supabase
      .from('auctions')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return auction
  }
}
```