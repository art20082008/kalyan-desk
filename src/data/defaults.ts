import type { AppData } from '../types'
import { MAX_SKU } from '../types'

export function createDefaultData(now = Date.now()): AppData {
  return {
    version: 1,
    hookahs: [],
    flavors: [],
    requests: [],
    sessions: [],
    plan: null,
    settings: {
      reminder: 'weekly',
      shiftEnd: '23:00',
      weekAnchorAt: now,
      lastWeeklyReminderAt: null,
      lastShiftReminderOn: null,
    },
  }
}

export function parseAppData(raw: unknown, now = Date.now()): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Файл данных повреждён')
  const value = raw as Partial<AppData>
  if (value.version !== 1) throw new Error('Неизвестная версия хранилища')
  if (
    !Array.isArray(value.hookahs) ||
    !Array.isArray(value.flavors) ||
    !Array.isArray(value.requests) ||
    !Array.isArray(value.sessions)
  ) {
    throw new Error('В файле не хватает списков')
  }
  if (value.flavors.length > MAX_SKU) throw new Error(`В хранилище больше ${MAX_SKU} вкусов`)
  const base = createDefaultData(now)
  return {
    version: 1,
    hookahs: value.hookahs,
    flavors: value.flavors,
    requests: value.requests,
    sessions: value.sessions,
    plan: value.plan ?? null,
    settings: { ...base.settings, ...(value.settings ?? {}) },
  }
}
