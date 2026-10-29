import type { AppData, HallTable, Hookah, HookahAlert, Settings, ShiftSummary } from '../types'
import { DEFAULT_ALERT_INTERVALS, normalizeIntervals } from '../domain/alertPresets'
import { MAX_SKU } from '../types'

export function defaultTables(): HallTable[] {
  return Array.from({ length: 6 }, (_, index) => ({
    id: `stol-${index + 1}`,
    label: `Стол ${index + 1}`,
  }))
}

function defaultSettings(now: number): Settings {
  return {
    reminder: 'weekly',
    shiftEnd: '23:00',
    weekAnchorAt: now,
    lastWeeklyReminderAt: null,
    lastShiftReminderOn: null,
    organizationName: 'Малевич',
    weekDay: 1,
    weekTime: '10:00',
    alertIntervals: [...DEFAULT_ALERT_INTERVALS],
    timerSound: true,
  }
}

export function createDefaultData(now = Date.now()): AppData {
  return {
    version: 1,
    hookahs: [],
    flavors: [],
    requests: [],
    sessions: [],
    plan: null,
    tables: defaultTables(),
    settings: defaultSettings(now),
    shifts: [],
  }
}

function migrateAlert(alert: HookahAlert): HookahAlert {
  return {
    id: alert.id,
    atMin: alert.atMin,
    firedAt: alert.firedAt ?? null,
    ackedAt: alert.ackedAt ?? null,
    ackedSmokingMs: alert.ackedSmokingMs ?? null,
  }
}

function migrateHookah(hookah: Hookah): Hookah {
  const flavorName = typeof hookah.flavorName === 'string' ? hookah.flavorName : ''
  return {
    ...hookah,
    flavorName,
    alerts: Array.isArray(hookah.alerts) ? hookah.alerts.map((alert) => migrateAlert(alert)) : [],
  }
}

function migrateTables(value: Partial<AppData>, hookahs: Hookah[]): HallTable[] {
  const stored = Array.isArray(value.tables) ? value.tables.filter((table) => table && table.id && table.label) : []
  const tables = stored.length > 0 ? stored : defaultTables()
  const known = new Set(tables.map((table) => table.label))
  const extra = hookahs
    .map((hookah) => hookah.table)
    .filter((label) => label && !known.has(label))
  const unique = [...new Set(extra)]
  return [
    ...tables,
    ...unique.map((label) => ({ id: crypto.randomUUID(), label })),
  ]
}

function migrateSettings(value: Partial<Settings> | undefined, now: number): Settings {
  const base = defaultSettings(now)
  const raw = value ?? {}
  const weekDay = Number(raw.weekDay)
  const name = typeof raw.organizationName === 'string' ? raw.organizationName.trim() : ''
  return {
    ...base,
    ...raw,
    organizationName: name || base.organizationName,
    weekDay: weekDay >= 1 && weekDay <= 7 ? weekDay : base.weekDay,
    weekTime: typeof raw.weekTime === 'string' && raw.weekTime.trim() ? raw.weekTime : base.weekTime,
    alertIntervals: normalizeIntervals(raw.alertIntervals),
    shiftEnd: raw.shiftEnd || base.shiftEnd,
    timerSound: raw.timerSound !== false,
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
  const hookahs = value.hookahs.map((hookah) => migrateHookah(hookah))
  return {
    version: 1,
    hookahs,
    flavors: value.flavors,
    requests: value.requests,
    sessions: value.sessions,
    plan: value.plan ?? null,
    tables: migrateTables(value, hookahs),
    settings: migrateSettings(value.settings, now),
    shifts: migrateShifts(value.shifts),
  }
}

function migrateShifts(value: ShiftSummary[] | undefined): ShiftSummary[] {
  if (!Array.isArray(value)) return []
  return value.filter((shift) => shift && shift.id && shift.dateKey)
}
