export const SWISS_TIMEZONE = 'Europe/Zurich'

export function formatSwissDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    return new Intl.DateTimeFormat('de-CH', {
      timeZone: SWISS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString().slice(0, 10)
  }
}

export function formatSwissDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    return new Intl.DateTimeFormat('de-CH', {
      timeZone: SWISS_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

export function addMinutes(date: Date, minutes: number): Date {
  const ms = date.getTime() + minutes * 60 * 1000
  return new Date(ms)
}

export function nowSwiss(): Date {
  return new Date()
}

