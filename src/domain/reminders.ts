import type { Flavor, Settings } from '../types'
import { localDateKey } from './format'

export function hasEndedStock(flavors: Flavor[]): boolean {
  return flavors.some((flavor) => flavor.status !== 'shelf')
}

function parseShift(shiftEnd: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(shiftEnd.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

function weekday(now: number): number {
  const js = new Date(now).getDay()
  return js === 0 ? 7 : js
}

export function reminderDue(settings: Settings, flavors: Flavor[], now: number): boolean {
  if (!hasEndedStock(flavors)) return false
  if (settings.reminder === 'weekly') {
    const day = settings.weekDay >= 1 && settings.weekDay <= 7 ? settings.weekDay : 1
    if (weekday(now) !== day) return false
    const time = parseShift(settings.weekTime || '10:00')
    if (!time) return false
    const date = new Date(now)
    const at = new Date(date)
    at.setHours(time.hours, time.minutes, 0, 0)
    if (date < at) return false
    if (settings.lastWeeklyReminderAt != null && localDateKey(settings.lastWeeklyReminderAt) === localDateKey(now)) {
      return false
    }
    return true
  }
  const shift = parseShift(settings.shiftEnd)
  if (!shift) return false
  const date = new Date(now)
  const end = new Date(date)
  end.setHours(shift.hours, shift.minutes, 0, 0)
  if (date < end) return false
  return settings.lastShiftReminderOn !== localDateKey(now)
}

export function markReminded(settings: Settings, now: number): Settings {
  if (settings.reminder === 'weekly') {
    return { ...settings, lastWeeklyReminderAt: now }
  }
  return { ...settings, lastShiftReminderOn: localDateKey(now) }
}

export const REMINDER_TEXT = 'Пора собрать заявку: на полке есть закончившиеся вкусы.'
