import React from 'react'
import { ImageBackground, View, StyleSheet, ViewProps } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

interface BackgroundProps extends ViewProps {
  children: React.ReactNode
}

export function Background({ children, style, ...rest }: BackgroundProps) {
  const { theme } = useTheme()

  const backgroundSource = theme === 'gradient'
    ? require('../../assets/gradient-background.jpeg')
    : theme === 'mascot'
      ? require('../../assets/imported/worky_mascot.png')
      : null

  const Wrapper: React.ComponentType<any> = backgroundSource ? ImageBackground : View
  const backgroundProps = backgroundSource
    ? { source: backgroundSource, resizeMode: 'cover' as const, blurRadius: theme === 'mascot' ? 20 : 0 }
    : {}

  return (
    <Wrapper style={[styles.background, theme === 'glass' && styles.blackBackground, style]} {...backgroundProps} {...rest}>
      {children}
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blackBackground: {
    backgroundColor: '#000000',
  },
})

