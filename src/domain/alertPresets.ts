export const INTERVAL_CHOICES = [5, 10, 15, 20] as const
export const MIN_ALERTS = 1
export const MAX_ALERTS = 5
export const DEFAULT_INTERVAL = 10
export const DEFAULT_ALERT_INTERVALS = [10, 10, 10]

export function isPresetInterval(minutes: number): minutes is (typeof INTERVAL_CHOICES)[number] {
  return (INTERVAL_CHOICES as readonly number[]).includes(minutes)
}

/** Пустая строка и числа вне 1–5 не принимаются. */
export function acceptAlertCount(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  const count = Number(value)
  if (count < MIN_ALERTS || count > MAX_ALERTS) return null
  return count
}

export function resizeIntervals(intervals: number[], count: number): number[] {
  const safe = Math.min(MAX_ALERTS, Math.max(MIN_ALERTS, Math.round(count)))
  const next = intervals
    .slice(0, safe)
    .map((minute) => (Number.isFinite(minute) && minute > 0 ? Math.round(minute) : DEFAULT_INTERVAL))
  while (next.length < safe) next.push(DEFAULT_INTERVAL)
  return next
}

export function normalizeIntervals(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_ALERT_INTERVALS]
  const minutes = value
    .map((item) => Math.round(Number(item)))
    .filter((minute) => Number.isFinite(minute) && minute > 0)
    .slice(0, MAX_ALERTS)
  if (minutes.length === 0) return [...DEFAULT_ALERT_INTERVALS]
  return minutes
}
