import React from 'react'
import { TextInput, View, TextInputProps } from 'react-native'
import { cn } from '../../lib/utils'

interface InputProps extends TextInputProps {
  className?: string
  error?: boolean
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <View className="relative">
      <TextInput
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive',
          className
        )}
        placeholderTextColor="hsl(var(--muted-foreground))"
        {...props}
      />
    </View>
  )
}
