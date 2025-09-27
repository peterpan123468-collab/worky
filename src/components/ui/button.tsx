import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacityProps } from 'react-native'

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  style?: ViewStyle
  disabled?: boolean
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  style,
  disabled = false,
  ...props
}: ButtonProps) {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[size],
    ...(disabled ? [styles.disabled] : []),
    ...(style ? [style] : []),
  ]

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
  ]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
      {...props}
    >
      <Text style={textStyle}>
        {children}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  default: {
    backgroundColor: '#171717',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  secondary: {
    backgroundColor: '#f5f5f5',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  destructive: {
    backgroundColor: '#ef4444',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  outline: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#ffffff',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ghost: {
    backgroundColor: 'transparent',
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  lg: {
    height: 44,
    paddingHorizontal: 32,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '500',
    fontSize: 14,
  },
  defaultText: {
    color: '#fafafa',
  },
  secondaryText: {
    color: '#171717',
  },
  destructiveText: {
    color: '#fafafa',
  },
  outlineText: {
    color: '#0a0a0a',
  },
  ghostText: {
    color: '#171717',
  },
})
