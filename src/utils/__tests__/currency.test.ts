import {
  CHF_MINIMUM,
  CHF_INCREMENT,
  formatCHF,
  sanitizeStartingPrice,
  isValidBidIncrement,
  nextValidBid,
  parseCHF
} from '../currency'

describe('Currency Utilities', () => {
  describe('formatCHF', () => {
    it('formats valid numbers correctly', () => {
      expect(formatCHF(25.50)).toBe('CHF 25.50')
      expect(formatCHF(100)).toBe('CHF 100.00')
      expect(formatCHF(0)).toBe('CHF 0.00')
    })

    it('handles invalid numbers', () => {
      expect(formatCHF(NaN)).toBe('CHF 0.00')
      expect(formatCHF(Infinity)).toBe('CHF Infinity.00')
      expect(formatCHF(-Infinity)).toBe('CHF -Infinity.00')
    })

    it('rounds to 2 decimal places', () => {
      expect(formatCHF(25.123)).toBe('CHF 25.12')
      expect(formatCHF(25.999)).toBe('CHF 26.00')
    })
  })

  describe('sanitizeStartingPrice', () => {
    it('enforces minimum CHF amount', () => {
      expect(sanitizeStartingPrice(10)).toBe(CHF_MINIMUM)
      expect(sanitizeStartingPrice(0)).toBe(CHF_MINIMUM)
      expect(sanitizeStartingPrice(-5)).toBe(CHF_MINIMUM)
    })

    it('rounds valid amounts', () => {
      expect(sanitizeStartingPrice(25.7)).toBe(26)
      expect(sanitizeStartingPrice(25.3)).toBe(25)
    })

    it('handles invalid inputs', () => {
      expect(sanitizeStartingPrice(NaN)).toBe(CHF_MINIMUM)
      expect(sanitizeStartingPrice(Infinity)).toBe(CHF_MINIMUM)
      expect(sanitizeStartingPrice(-Infinity)).toBe(CHF_MINIMUM)
    })

    it('accepts valid amounts above minimum', () => {
      expect(sanitizeStartingPrice(50)).toBe(50)
      expect(sanitizeStartingPrice(100)).toBe(100)
    })
  })

  describe('isValidBidIncrement', () => {
    it('validates correct increments', () => {
      expect(isValidBidIncrement(20, 25, CHF_INCREMENT)).toBe(true)
      expect(isValidBidIncrement(25, 30, CHF_INCREMENT)).toBe(true)
      expect(isValidBidIncrement(30, 40, 10)).toBe(true)
    })

    it('rejects invalid increments', () => {
      expect(isValidBidIncrement(20, 23, CHF_INCREMENT)).toBe(false)
      expect(isValidBidIncrement(25, 26, CHF_INCREMENT)).toBe(false)
      expect(isValidBidIncrement(30, 35, 10)).toBe(false)
    })

    it('rejects non-increasing bids', () => {
      expect(isValidBidIncrement(25, 25, CHF_INCREMENT)).toBe(false)
      expect(isValidBidIncrement(25, 20, CHF_INCREMENT)).toBe(false)
    })

    it('uses default increment when not specified', () => {
      expect(isValidBidIncrement(20, 25)).toBe(true)
      expect(isValidBidIncrement(20, 23)).toBe(false)
    })
  })

  describe('nextValidBid', () => {
    it('calculates next valid bid amount', () => {
      expect(nextValidBid(20)).toBe(25)
      expect(nextValidBid(25)).toBe(30)
      expect(nextValidBid(100)).toBe(105)
    })

    it('respects custom increment', () => {
      expect(nextValidBid(20, 10)).toBe(30)
      expect(nextValidBid(25, 15)).toBe(40)
    })

    it('handles edge cases', () => {
      expect(nextValidBid(0)).toBe(5)
      expect(nextValidBid(-5)).toBe(0)
    })
  })

  describe('parseCHF', () => {
    it('parses CHF formatted strings', () => {
      expect(parseCHF('CHF 25.50')).toBe(25.50)
      expect(parseCHF('CHF 100')).toBe(100)
      expect(parseCHF('25.50')).toBe(25.50)
    })

    it('handles comma as decimal separator', () => {
      expect(parseCHF('25,50')).toBe(25.50)
      expect(parseCHF('CHF 25,50')).toBe(25.50)
    })

    it('strips non-numeric characters', () => {
      expect(parseCHF('CHF 25.50 (bid)')).toBe(25.50)
      expect(parseCHF('Price: CHF 100.00')).toBe(100)
    })

    it('handles invalid inputs', () => {
      expect(parseCHF('')).toBe(0)
      expect(parseCHF('abc')).toBe(0)
      expect(parseCHF('CHF')).toBe(0)
    })

    it('handles multiple dots/commas', () => {
      expect(parseCHF('25.50.30')).toBe(25.50) // parseFloat behavior
      expect(parseCHF('25,50,30')).toBe(25.50)
    })
  })
})