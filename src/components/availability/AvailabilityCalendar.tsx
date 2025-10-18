import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { glassCard } from '../themeStyles'

interface MarkedDay {
  date: string
  hasOpen: boolean
  hasBlocked: boolean
}

interface AvailabilityCalendarProps {
  currentMonth: Date
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onChangeMonth: (offset: number) => void
  markedDays: MarkedDay[]
}

function formatDate(date: Date) {
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getMonthMatrix(base: Date) {
  const firstDay = new Date(base.getFullYear(), base.getMonth(), 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7 // convert Sunday (0) to 6
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()

  const cells: Array<{ date: Date; inMonth: boolean }> = []

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(base.getFullYear(), base.getMonth(), -i)
    cells.push({ date, inMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(base.getFullYear(), base.getMonth(), day),
      inMonth: true,
    })
  }

  const extra = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= extra; i += 1) {
    cells.push({ date: new Date(base.getFullYear(), base.getMonth() + 1, i), inMonth: false })
  }

  return cells
}

export function AvailabilityCalendar({
  currentMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  markedDays,
}: AvailabilityCalendarProps) {
  const matrix = useMemo(() => getMonthMatrix(currentMonth), [currentMonth])
  const markedMap = useMemo(() => {
    const map: Record<string, MarkedDay> = {}
    markedDays.forEach((entry) => { map[entry.date] = entry })
    return map
  }, [markedDays])

  const monthLabel = currentMonth.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
  const selectedLabel = formatDate(selectedDate)

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

  return (
    <View style={styles.container}>
      <View style={styles.selectionHeader}>
        <Text style={styles.selectionText}>{selectedLabel}</Text>
      </View>

      <View style={[styles.calendarCard, glassCard]}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => onChangeMonth(-1)} accessibilityLabel="Vorheriger Monat">
            <Text style={styles.chevron}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => onChangeMonth(1)} accessibilityLabel="Nächster Monat">
            <Text style={styles.chevron}>▶</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((label) => (
            <Text key={label} style={styles.weekday}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {matrix.map(({ date, inMonth }) => {
            const iso = date.toISOString().slice(0, 10)
            const marked = markedMap[iso]
            const selected = isSameDay(date, selectedDate)
            return (
              <TouchableOpacity
                key={iso + inMonth}
                style={[styles.dayCell, selected && styles.daySelected, !inMonth && styles.dayMuted]}
                onPress={() => onSelectDate(date)}
                accessibilityLabel={`Select ${iso}`}
                testID={`availability-day-${iso}`}
              >
                <Text style={[styles.dayText, selected && styles.daySelectedText, !inMonth && styles.dayMutedText]}>
                  {date.getDate()}
                </Text>
                {marked ? (
                  <View style={styles.dotRow}>
                    {marked.hasOpen ? <View style={[styles.dot, styles.dotOpen]} /> : null}
                    {marked.hasBlocked ? <View style={[styles.dot, styles.dotBlocked]} /> : null}
                  </View>
                ) : null}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  selectionHeader: {
    paddingHorizontal: 4,
  },
  selectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  chevron: {
    color: '#ffffff',
    fontSize: 18,
    paddingHorizontal: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekday: {
    width: 36,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  daySelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  dayText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  daySelectedText: {
    color: '#ffffff',
  },
  dayMuted: {
    opacity: 0.35,
  },
  dayMutedText: {
    color: 'rgba(255,255,255,0.5)',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: '#f59e0b', // Orange for open slots
  },
  dotBlocked: {
    backgroundColor: '#10b981', // Green for confirmed bookings
  },
})
