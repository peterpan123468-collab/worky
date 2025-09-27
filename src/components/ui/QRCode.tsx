import React from 'react'
import { View, StyleSheet } from 'react-native'
import QRCodeSVG from 'react-native-qrcode-svg'

interface QRCodeProps {
  value: string
  size?: number
  color?: string
  backgroundColor?: string
  logo?: number // Local image asset
  logoSize?: number
  logoBackgroundColor?: string
  logoMargin?: number
  logoBorderRadius?: number
  ecl?: 'L' | 'M' | 'Q' | 'H'
}

export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#ffffff',
  logo,
  logoSize,
  logoBackgroundColor = 'transparent',
  logoMargin = 2,
  logoBorderRadius = 0,
  ecl = 'M'
}) => {
  return (
    <View style={styles.container}>
      <QRCodeSVG
        value={value}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        logo={logo}
        logoSize={logoSize}
        logoBackgroundColor={logoBackgroundColor}
        logoMargin={logoMargin}
        logoBorderRadius={logoBorderRadius}
        ecl={ecl}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
})