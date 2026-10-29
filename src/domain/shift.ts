import type { AppData, ShiftSummary } from '../types'
import { localDateKey, round1 } from './format'
import { finishHookah, timerSnapshot } from './timers'

/** Закрывает все таймеры и пишет итог смены: сколько кальянов, среднее время, дата. */
export function closeShift(data: AppData, now: number): { data: AppData; shift: ShiftSummary } {
  const open = data.hookahs.filter((hookah) => hookah.finishedAt == null)
  let sessions = data.sessions
  const minutes = open.map((hookah) => {
    const result = finishHookah(hookah, now)
    if (result.session) sessions = [...sessions, result.session]
    return round1(timerSnapshot(hookah, now).smokingMs / 60_000)
  })
  const averageMin = minutes.length === 0 ? null : round1(minutes.reduce((sum, value) => sum + value, 0) / minutes.length)
  const shift: ShiftSummary = {
    id: crypto.randomUUID(),
    endedAt: now,
    dateKey: localDateKey(now),
    hookahCount: open.length,
    averageMin,
  }
  return {
    shift,
    data: {
      ...data,
      hookahs: [],
      sessions,
      shifts: [shift, ...(data.shifts ?? [])],
    },
  }
}
