export const MAX_SKU = 500

export const HOOKAH_KINDS = [
  'Чаша',
  'Грейпфрут',
  'Ананас',
  'Арбуз',
  'Кокос',
  'Помело',
  'Колба',
  'Другое',
] as const

export type SectionId = 'timers' | 'shelf' | 'history'

export type FlavorStatus = 'shelf' | 'stop' | 'request'

export interface HookahAlert {
  id: string
  /** Длина интервала в минутах. Следующий отсчёт начинается с подтверждения предыдущего. */
  atMin: number
  /** Дополнительные секунды интервала, 0–59. */
  atSec?: number
  firedAt: number | null
  ackedAt: number | null
  /** Сколько уже шло курение (мс) в момент подтверждения. От этой точки считается следующий интервал. */
  ackedSmokingMs: number | null
}

export interface Hookah {
  id: string
  table: string
  /** Вкус чаши. Пустая строка, если его не вписали. */
  flavorName: string
  kind: string
  durationMin: number
  warmupMin: number
  running: boolean
  elapsedBeforeMs: number
  startedAt: number | null
  finishedAt: number | null
  alerts: HookahAlert[]
  /** Позиция на плане, 0–100. null — не стоит на схеме. */
  x: number | null
  y: number | null
  recordedSessionId: string | null
  createdAt: number
}

export interface Flavor {
  id: string
  brand: string
  name: string
  status: FlavorStatus
}

export interface OrderLine {
  id: string
  brand: string
  name: string
}

export interface OrderRequest {
  id: string
  createdAt: number
  flavors: OrderLine[]
}

export interface ReactionRecord {
  atMin: number
  reactionMs: number
}

export interface SmokingSession {
  id: string
  hookahId: string
  table: string
  kind: string
  startedAt: number
  finishedAt: number
  plannedMin: number
  actualMin: number
  reactions: ReactionRecord[]
}

export type ReminderMode = 'weekly' | 'shift'

export interface Settings {
  reminder: ReminderMode
  /** Локальное время компьютера, «ЧЧ:ММ». */
  shiftEnd: string
  weekAnchorAt: number
  lastWeeklyReminderAt: number | null
  /** Календарный день, когда уже напомнили в конце смены: ГГГГ-ММ-ДД. */
  lastShiftReminderOn: string | null
  /** Название в шапке. По умолчанию «Малевич». */
  organizationName: string
  /** 1 = понедельник … 7 = воскресенье. */
  weekDay: number
  /** Локальное время еженедельного напоминания, «ЧЧ:ММ». */
  weekTime: string
  /** Интервалы таймеров нового кальяна, от 1 до 5 значений в минутах. */
  alertIntervals: number[]
  /** Один системный сигнал, когда таймер срабатывает. */
  timerSound: boolean
}

export interface ShiftSummary {
  id: string
  endedAt: number
  /** Календарный день смены, ГГГГ-ММ-ДД. */
  dateKey: string
  hookahCount: number
  averageMin: number | null
}

export interface HallTable {
  id: string
  label: string
}

export interface PlanMeta {
  fileName: string
  updatedAt: number
}

export interface AppData {
  version: 1
  hookahs: Hookah[]
  flavors: Flavor[]
  requests: OrderRequest[]
  sessions: SmokingSession[]
  settings: Settings
  plan: PlanMeta | null
  /** Столы схемы зала. Старый JPEG плана не удаляется, но в интерфейсе не используется. */
  tables: HallTable[]
  shifts: ShiftSummary[]
}

export interface UndoMove {
  flavorId: string
  from: FlavorStatus
  at: number
}

export interface FiredAlert {
  hookahId: string
  alertId: string
  table: string
  atMin: number
}
