import React from 'react'
import { View, ViewProps, StyleSheet } from 'react-native'

interface CardProps extends ViewProps {
  children: React.ReactNode
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  )
}

interface CardHeaderProps extends ViewProps {
  children: React.ReactNode
}

export function CardHeader({ children, style, ...props }: CardHeaderProps) {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  )
}

interface CardContentProps extends ViewProps {
  children: React.ReactNode
}

export function CardContent({ children, style, ...props }: CardContentProps) {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 0,
  },
  cardContent: {
    padding: 24,
    paddingTop: 0,
  },
})
