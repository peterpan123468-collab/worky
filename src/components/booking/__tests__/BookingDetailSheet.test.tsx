jest.mock('../../../contexts/ThemeContext', () => ({
  __esModule: true,
  useTheme: () => ({ theme: 'glass', setTheme: jest.fn() })
}))

import React from 'react'
import { render } from '@testing-library/react-native'

import { BookingDetailSheet } from '../BookingDetailSheet'

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react')
  const { View } = require('react-native')
  return React.forwardRef((props: any, ref: any) => {
    const { children, visible, ...rest } = props
    if (!visible) return null
    return (
      <View ref={ref} {...rest}>
        {children}
      </View>
    )
  })
})

describe('BookingDetailSheet', () => {
  it('renders nothing when booking is absent', () => {
    const { toJSON } = render(
      <BookingDetailSheet
        booking={null}
        visible={false}
        onClose={jest.fn()}
        onCancel={jest.fn()}
        onReschedule={jest.fn()}
        actionLoading={false}
      />
    )

    expect(toJSON()).toBeNull()
  })
})
