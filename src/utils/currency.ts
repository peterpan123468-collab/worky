export const CHF_MINIMUM = 20
export const CHF_INCREMENT = 5

export function formatCHF(value: number): string {
  if (Number.isNaN(value)) return 'CHF 0.00'
  return `CHF ${value.toFixed(2)}`
}

export function sanitizeStartingPrice(value: number): number {
  if (!Number.isFinite(value) || value < CHF_MINIMUM) return CHF_MINIMUM
  return Math.round(value)
}

export function isValidBidIncrement(current: number, next: number, increment: number = CHF_INCREMENT): boolean {
  if (next <= current) return false
  const delta = next - current
  return delta % increment === 0
}

export function nextValidBid(current: number, increment: number = CHF_INCREMENT): number {
  return current + increment
}

export function parseCHF(input: string): number {
  const cleaned = input.replace(/[^0-9.,-]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

