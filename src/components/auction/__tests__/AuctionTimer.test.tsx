import React from 'react'
import { render, act } from '@testing-library/react-native'
import { AuctionTimer } from '../AuctionTimer'

describe('AuctionTimer', () => {
  const baseTime = new Date('2024-09-14T10:00:00Z').getTime()

  const advance = (ms: number) => {
    act(() => {
      jest.advanceTimersByTime(ms)
    })
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(baseTime)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('displays remaining time correctly', async () => {
    const endsAt = new Date('2024-09-14T10:05:30Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('5m 30s')).toBeTruthy()
  })

  it('updates timer every second', async () => {
    const endsAt = new Date('2024-09-14T10:02:00Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('2m 0s')).toBeTruthy()

    advance(30000)
    expect(await findByText('1m 30s')).toBeTruthy()

    advance(30000)
    expect(await findByText('1m 0s')).toBeTruthy()
  })

  it('displays zero when auction has ended', async () => {
    const endsAt = new Date('2024-09-14T09:55:00Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('0m 0s')).toBeTruthy()
  })

  it('handles seconds countdown correctly', async () => {
    const endsAt = new Date('2024-09-14T10:00:45Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('0m 45s')).toBeTruthy()

    advance(10000)
    expect(await findByText('0m 35s')).toBeTruthy()
  })

  it('handles large time differences correctly', async () => {
    const endsAt = new Date('2024-09-14T11:25:00Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('85m 0s')).toBeTruthy()
  })

  it('updates when endsAt prop changes', async () => {
    const initialEndsAt = new Date('2024-09-14T10:02:00Z').toISOString()
    const { findByText, rerender } = render(<AuctionTimer endsAt={initialEndsAt} />)

    expect(await findByText('2m 0s')).toBeTruthy()

    const newEndsAt = new Date('2024-09-14T10:05:00Z').toISOString()
    rerender(<AuctionTimer endsAt={newEndsAt} />)

    expect(await findByText('5m 0s')).toBeTruthy()
  })

  it('cleans up interval on unmount', () => {
    const endsAt = new Date('2024-09-14T10:05:00Z').toISOString()
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = render(<AuctionTimer endsAt={endsAt} />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('handles invalid date strings gracefully', async () => {
    const { findByText } = render(<AuctionTimer endsAt='invalid-date' />)

    expect(await findByText('0m 0s')).toBeTruthy()
  })

  it('handles edge case of exactly zero time remaining', async () => {
    const endsAt = new Date('2024-09-14T10:00:00Z').toISOString()
    const { findByText } = render(<AuctionTimer endsAt={endsAt} />)

    expect(await findByText('0m 0s')).toBeTruthy()
  })

  it('displays time correctly for various durations', async () => {
    const testCases = [
      { duration: 59, expected: '0m 59s' },
      { duration: 60, expected: '1m 0s' },
      { duration: 125, expected: '2m 5s' },
      { duration: 3661, expected: '61m 1s' }
    ]

    for (const { duration, expected } of testCases) {
      jest.setSystemTime(baseTime)
      const endsAt = new Date(baseTime + duration * 1000).toISOString()
      const { findByText, unmount } = render(<AuctionTimer endsAt={endsAt} />)

      expect(await findByText(expected)).toBeTruthy()

      unmount()
    }
  })
})
