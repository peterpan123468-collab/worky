jest.mock('../../../contexts/ThemeContext', () => ({
  __esModule: true,
  useTheme: () => ({ theme: 'glass', setTheme: jest.fn() })
}))

import React from 'react'
import { render } from '@testing-library/react-native'

import { BookingFormModal } from '../BookingFormModal'

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

describe('BookingFormModal', () => {
  it('renders nothing when slot is not provided', () => {
    const { toJSON } = render(
      <BookingFormModal
        visible
        slot={null}
        onClose={jest.fn()}
        onSubmit={jest.fn() as any}
        submitting={false}
        estimatedPrice={null}
      />
    )

    expect(toJSON()).toBeNull()
  })
})
