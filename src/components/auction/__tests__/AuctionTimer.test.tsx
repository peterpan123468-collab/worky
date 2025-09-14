import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { AuctionTimer } from '../AuctionTimer'

// Mock timers for testing
jest.useFakeTimers()

describe('AuctionTimer', () => {
  beforeEach(() => {
    jest.clearAllTimers()
    // Mock Date.now() to have a consistent base time
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-09-14T10:00:00Z').getTime())
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('displays remaining time correctly', () => {
    // Set auction to end in 5 minutes and 30 seconds
    const endsAt = new Date('2024-09-14T10:05:30Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    // Run initial timer calculation
    jest.advanceTimersByTime(1000)

    expect(getByText('5m 30s')).toBeTruthy()
  })

  it('updates timer every second', () => {
    const endsAt = new Date('2024-09-14T10:02:00Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    // Initial state - 2 minutes
    jest.advanceTimersByTime(1000)
    expect(getByText('2m 0s')).toBeTruthy()

    // After 30 seconds - 1 minute 30 seconds
    jest.advanceTimersByTime(30000)
    expect(getByText('1m 30s')).toBeTruthy()

    // After another 30 seconds - 1 minute
    jest.advanceTimersByTime(30000)
    expect(getByText('1m 0s')).toBeTruthy()
  })

  it('displays zero when auction has ended', () => {
    // Set auction end time in the past
    const endsAt = new Date('2024-09-14T09:55:00Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    jest.advanceTimersByTime(1000)

    expect(getByText('0m 0s')).toBeTruthy()
  })

  it('handles seconds countdown correctly', () => {
    // Set auction to end in 45 seconds
    const endsAt = new Date('2024-09-14T10:00:45Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    jest.advanceTimersByTime(1000)
    expect(getByText('0m 45s')).toBeTruthy()

    // Advance 10 seconds
    jest.advanceTimersByTime(10000)
    expect(getByText('0m 35s')).toBeTruthy()
  })

  it('handles large time differences correctly', () => {
    // Set auction to end in 1 hour and 25 minutes
    const endsAt = new Date('2024-09-14T11:25:00Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    jest.advanceTimersByTime(1000)
    expect(getByText('85m 0s')).toBeTruthy()
  })

  it('updates when endsAt prop changes', () => {
    const initialEndsAt = new Date('2024-09-14T10:02:00Z').toISOString()

    const { getByText, rerender } = render(<AuctionTimer endsAt={initialEndsAt} />)

    jest.advanceTimersByTime(1000)
    expect(getByText('2m 0s')).toBeTruthy()

    // Change the end time to 5 minutes from now
    const newEndsAt = new Date('2024-09-14T10:05:00Z').toISOString()
    rerender(<AuctionTimer endsAt={newEndsAt} />)

    jest.advanceTimersByTime(1000)
    expect(getByText('5m 0s')).toBeTruthy()
  })

  it('cleans up interval on unmount', () => {
    const endsAt = new Date('2024-09-14T10:05:00Z').toISOString()
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = render(<AuctionTimer endsAt={endsAt} />)

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('handles invalid date strings gracefully', () => {
    const { getByText } = render(<AuctionTimer endsAt="invalid-date" />)

    jest.advanceTimersByTime(1000)

    // Should display 0m 0s for invalid dates (since diff would be negative and Math.max returns 0)
    expect(getByText('0m 0s')).toBeTruthy()
  })

  it('handles edge case of exactly zero time remaining', () => {
    // Set auction to end exactly now
    const endsAt = new Date('2024-09-14T10:00:00Z').toISOString()

    const { getByText } = render(<AuctionTimer endsAt={endsAt} />)

    jest.advanceTimersByTime(1000)

    expect(getByText('0m 0s')).toBeTruthy()
  })

  it('displays time correctly for various durations', () => {
    const testCases = [
      { duration: 59, expected: '0m 59s' },      // Less than a minute
      { duration: 60, expected: '1m 0s' },       // Exactly one minute
      { duration: 125, expected: '2m 5s' },      // Two minutes and 5 seconds
      { duration: 3661, expected: '61m 1s' },    // Over an hour (61 minutes 1 second)
    ]

    testCases.forEach(({ duration, expected }) => {
      const endsAt = new Date(Date.now() + duration * 1000).toISOString()

      const { getByText, unmount } = render(<AuctionTimer endsAt={endsAt} />)

      jest.advanceTimersByTime(1000)
      expect(getByText(expected)).toBeTruthy()

      unmount()
    })
  })
})