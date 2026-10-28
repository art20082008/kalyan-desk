import type { AppData, FiredAlert, Hookah, HookahAlert, SmokingSession } from '../types'
import { formatClock, round1 } from './format'

export interface TimerSnapshot {
  phase: 'idle' | 'warmup' | 'smoking' | 'finished'
  elapsedMs: number
  smokingMs: number
  remainingMs: number
  progress: number
}

export function totalElapsedMs(hookah: Hookah, now: number): number {
  const live = hookah.running && hookah.startedAt != null ? Math.max(0, now - hookah.startedAt) : 0
  return hookah.elapsedBeforeMs + live
}

export function timerSnapshot(hookah: Hookah, now: number): TimerSnapshot {
  const elapsedMs = totalElapsedMs(hookah, now)
  const warmupMs = Math.max(0, hookah.warmupMin) * 60_000
  const durationMs = Math.max(1, hookah.durationMin) * 60_000
  const smokingMs = Math.max(0, elapsedMs - warmupMs)

  if (hookah.finishedAt != null) {
    return { phase: 'finished', elapsedMs, smokingMs, remainingMs: 0, progress: 1 }
  }

  const neverRan = !hookah.running && hookah.startedAt == null && hookah.elapsedBeforeMs === 0
  if (neverRan) {
    return {
      phase: 'idle',
      elapsedMs: 0,
      smokingMs: 0,
      remainingMs: durationMs,
      progress: 0,
    }
  }

  if (hookah.warmupMin > 0 && elapsedMs < warmupMs) {
    return {
      phase: 'warmup',
      elapsedMs,
      smokingMs: 0,
      remainingMs: warmupMs - elapsedMs,
      progress: warmupMs === 0 ? 1 : elapsedMs / warmupMs,
    }
  }

  return {
    phase: 'smoking',
    elapsedMs,
    smokingMs,
    remainingMs: Math.max(0, durationMs - smokingMs),
    progress: Math.min(1, smokingMs / durationMs),
  }
}

function anchorMs(hookah: Hookah, index: number): number {
  if (index <= 0) return 0
  const prev = hookah.alerts[index - 1]
  if (prev.ackedAt == null) return Number.POSITIVE_INFINITY
  if (prev.ackedSmokingMs != null) return prev.ackedSmokingMs
  return hookah.alerts.slice(0, index).reduce((sum, alert) => sum + alert.atMin, 0) * 60_000
}

export function isAlertDue(hookah: Hookah, alert: HookahAlert, now: number): boolean {
  if (alert.ackedAt != null || hookah.finishedAt != null) return false
  const index = hookah.alerts.findIndex((item) => item.id === alert.id)
  if (index < 0) return false
  if (index > 0 && hookah.alerts[index - 1].ackedAt == null) return false
  const snap = timerSnapshot(hookah, now)
  if (snap.phase === 'idle' || snap.phase === 'warmup') return false
  const anchor = anchorMs(hookah, index)
  if (!Number.isFinite(anchor)) return false
  return snap.smokingMs + 1e-9 >= anchor + alert.atMin * 60_000
}

export function openAlerts(hookah: Hookah, now: number): HookahAlert[] {
  return hookah.alerts.filter((alert) => isAlertDue(hookah, alert, now))
}

export function openAlertIndex(hookah: Hookah, now: number): number | null {
  const index = hookah.alerts.findIndex((alert) => isAlertDue(hookah, alert, now))
  return index < 0 ? null : index
}

/** Все шаги подтверждены, кальян ещё не завершён вручную. */
export function alertsCleared(hookah: Hookah): boolean {
  return hookah.finishedAt == null && hookah.alerts.length > 0 && hookah.alerts.every((alert) => alert.ackedAt != null)
}

/** Секунды сверх последнего подтверждённого алерта. Пауза останавливает счётчик. */
export function overtimeMs(hookah: Hookah, now: number): number {
  if (!alertsCleared(hookah)) return 0
  const last = hookah.alerts[hookah.alerts.length - 1]
  if (last.ackedSmokingMs == null) return 0
  return Math.max(0, timerSnapshot(hookah, now).smokingMs - last.ackedSmokingMs)
}

/** Сколько осталось до следующего ещё не сработавшего интервала. */
export function nextSignalMs(hookah: Hookah, now: number): number | null {
  if (hookah.finishedAt != null || alertsCleared(hookah)) return null
  const snap = timerSnapshot(hookah, now)
  if (snap.phase === 'idle' || snap.phase === 'finished') return null
  for (let index = 0; index < hookah.alerts.length; index += 1) {
    const alert = hookah.alerts[index]
    if (alert.ackedAt != null) continue
    if (isAlertDue(hookah, alert, now)) return 0
    if (index > 0 && hookah.alerts[index - 1].ackedAt == null) return null
    const anchor = anchorMs(hookah, index)
    if (!Number.isFinite(anchor)) return null
    const smokingLeft = Math.max(0, anchor + alert.atMin * 60_000 - snap.smokingMs)
    const warmupLeft = snap.phase === 'warmup' ? snap.remainingMs : 0
    return warmupLeft + smokingLeft
  }
  return null
}

export function reactionCaption(hookah: Hookah, now: number): string | null {
  const done = hookah.alerts.filter((alert) => alert.firedAt != null && alert.ackedAt != null)
  if (done.length === 0) return null
  const last = done[done.length - 1]
  const reactionMin = Math.floor((last.ackedAt! - last.firedAt!) / 60_000)
  const agoMin = Math.floor(Math.max(0, now - last.ackedAt!) / 60_000)
  const reaction = reactionMin < 1 ? '< 1 мин' : `${reactionMin} мин`
  const ago = agoMin < 1 ? '< 1 мин назад' : `${agoMin} мин назад`
  return `Реакция на стол: ${reaction} · последняя ${ago}`
}

export type TimerVisual = 'idle' | 'warmup' | 'running' | 'paused' | 'alert' | 'overtime' | 'finished'

export interface TimerFace {
  visual: TimerVisual
  clock: string
  clockTone: 'primary' | 'citrus' | 'error'
  progress: number
  barTone: 'brand' | 'citrus' | 'error'
  plan: string
  detail: string
  detailTone: 'primary' | 'muted' | 'citrus' | 'error'
  tag: string
  tagTone: 'brand' | 'citrus'
  reaction: string | null
  pulsing: boolean
  showContinue: boolean
  showFinish: boolean
  running: boolean
}

export function timerFace(hookah: Hookah, now: number): TimerFace {
  const snap = timerSnapshot(hookah, now)
  const alertIndex = openAlertIndex(hookah, now)
  const reaction = reactionCaption(hookah, now)
  const planFull = `${Math.round(snap.progress * 100)}% · план ${hookah.durationMin} мин`
  const signal = nextSignalMs(hookah, now)
  const signalText = signal == null ? '' : `Следующий сигнал через ${formatClock(signal)}`

  if (snap.phase === 'finished') {
    return {
      visual: 'finished',
      clock: formatClock(snap.smokingMs),
      clockTone: 'primary',
      progress: 1,
      barTone: 'brand',
      plan: `план ${hookah.durationMin} мин`,
      detail: 'Сессия завершена',
      detailTone: 'muted',
      tag: 'Готово',
      tagTone: 'brand',
      reaction,
      pulsing: false,
      showContinue: false,
      showFinish: false,
      running: false,
    }
  }

  if (alertIndex != null) {
    return {
      visual: 'alert',
      clock: formatClock(snap.smokingMs),
      clockTone: 'citrus',
      progress: snap.progress,
      barTone: 'citrus',
      plan: planFull,
      detail: `Алерт ${alertIndex + 1} из ${hookah.alerts.length} сработал`,
      detailTone: 'citrus',
      tag: 'Алерт',
      tagTone: 'citrus',
      reaction,
      pulsing: true,
      showContinue: true,
      showFinish: true,
      running: hookah.running,
    }
  }

  if (alertsCleared(hookah)) {
    return {
      visual: 'overtime',
      clock: `+${formatClock(overtimeMs(hookah, now))}`,
      clockTone: 'error',
      progress: 1,
      barTone: 'error',
      plan: `план ${hookah.durationMin} мин`,
      detail: 'Все алерты пройдены · сверх плана',
      detailTone: 'error',
      tag: 'Сверх плана',
      tagTone: 'brand',
      reaction,
      pulsing: false,
      showContinue: true,
      showFinish: true,
      running: hookah.running,
    }
  }

  if (snap.phase === 'warmup') {
    return {
      visual: 'warmup',
      clock: formatClock(snap.remainingMs),
      clockTone: 'primary',
      progress: snap.progress,
      barTone: 'brand',
      plan: `план ${hookah.durationMin} мин`,
      detail: signalText || `До курения ${formatClock(snap.remainingMs)}`,
      detailTone: 'primary',
      tag: 'Прогрев',
      tagTone: 'brand',
      reaction,
      pulsing: false,
      showContinue: false,
      showFinish: true,
      running: hookah.running,
    }
  }

  if (snap.phase === 'idle') {
    return {
      visual: 'idle',
      clock: formatClock(0),
      clockTone: 'primary',
      progress: 0,
      barTone: 'brand',
      plan: `0% · план ${hookah.durationMin} мин`,
      detail: 'Таймер ещё не запущен',
      detailTone: 'muted',
      tag: 'Не запущен',
      tagTone: 'brand',
      reaction,
      pulsing: false,
      showContinue: false,
      showFinish: false,
      running: false,
    }
  }

  const paused = !hookah.running
  return {
    visual: paused ? 'paused' : 'running',
    clock: formatClock(snap.smokingMs),
    clockTone: 'primary',
    progress: snap.progress,
    barTone: 'brand',
    plan: planFull,
    detail: signalText,
    detailTone: 'primary',
    tag: paused ? 'Пауза' : 'В работе',
    tagTone: 'brand',
    reaction,
    pulsing: false,
    showContinue: false,
    showFinish: true,
    running: hookah.running,
  }
}

export interface EarliestAlert {
  hookahId: string
  alertId: string
  firedAt: number
}

/** Самый ранний непринятый алерт. Если время срабатывания ещё не записано, берётся now. */
export function earliestOpenAlert(hookahs: Hookah[], now: number): EarliestAlert | null {
  let best: EarliestAlert | null = null
  for (const hookah of hookahs) {
    for (const alert of hookah.alerts) {
      if (!isAlertDue(hookah, alert, now)) continue
      const firedAt = alert.firedAt ?? now
      if (!best || firedAt < best.firedAt || (firedAt === best.firedAt && alert.id < best.alertId)) {
        best = { hookahId: hookah.id, alertId: alert.id, firedAt }
      }
    }
  }
  return best
}

export function reactionMs(alert: HookahAlert, now: number): number | null {
  if (alert.firedAt == null) return null
  return Math.max(0, (alert.ackedAt ?? now) - alert.firedAt)
}

export function stampDueAlerts(hookahs: Hookah[], now: number): { hookahs: Hookah[]; fired: FiredAlert[] } {
  const fired: FiredAlert[] = []
  let changed = false
  const next = hookahs.map((hookah) => {
    let hookahChanged = false
    const alerts = hookah.alerts.map((alert) => {
      if (alert.firedAt == null && isAlertDue(hookah, alert, now)) {
        hookahChanged = true
        fired.push({
          hookahId: hookah.id,
          alertId: alert.id,
          table: hookah.table,
          atMin: alert.atMin,
        })
        return { ...alert, firedAt: now }
      }
      return alert
    })
    if (!hookahChanged) return hookah
    changed = true
    return { ...hookah, alerts }
  })
  return { hookahs: changed ? next : hookahs, fired }
}

function reactionsOf(hookah: Hookah): SmokingSession['reactions'] {
  return hookah.alerts
    .filter((alert) => alert.firedAt != null && alert.ackedAt != null)
    .map((alert) => ({ atMin: alert.atMin, reactionMs: alert.ackedAt! - alert.firedAt! }))
}

export function freezeHookah(hookah: Hookah, now: number, finished: boolean): Hookah {
  const elapsed = totalElapsedMs(hookah, now)
  return {
    ...hookah,
    running: false,
    startedAt: null,
    elapsedBeforeMs: elapsed,
    finishedAt: finished ? (hookah.finishedAt ?? now) : hookah.finishedAt,
  }
}

export function recordSession(hookah: Hookah, now: number): { hookah: Hookah; session: SmokingSession | null } {
  if (hookah.recordedSessionId) return { hookah, session: null }
  const snap = timerSnapshot({ ...hookah, finishedAt: hookah.finishedAt ?? now }, now)
  const actualMin = round1(snap.smokingMs / 60_000)
  if (actualMin < 1) {
    return { hookah: { ...hookah, recordedSessionId: crypto.randomUUID() }, session: null }
  }
  const session: SmokingSession = {
    id: crypto.randomUUID(),
    hookahId: hookah.id,
    table: hookah.table,
    kind: hookah.kind,
    startedAt: hookah.createdAt,
    finishedAt: now,
    plannedMin: hookah.durationMin,
    actualMin,
    reactions: reactionsOf(hookah),
  }
  return { hookah: { ...hookah, recordedSessionId: session.id }, session }
}

export function applyTimerTick(data: AppData, now: number): { data: AppData; fired: FiredAlert[] } {
  const stamped = stampDueAlerts(data.hookahs, now)
  if (stamped.hookahs === data.hookahs) return { data, fired: stamped.fired }
  return {
    data: { ...data, hookahs: stamped.hookahs },
    fired: stamped.fired,
  }
}

export function finishHookah(hookah: Hookah, now: number): { hookah: Hookah; session: SmokingSession | null } {
  return recordSession(freezeHookah(hookah, now, true), now)
}

export function acknowledgeAlert(hookah: Hookah, alertId: string, now: number): Hookah {
  const smokingMs = timerSnapshot(hookah, now).smokingMs
  let changed = false
  const alerts = hookah.alerts.map((alert) => {
    if (alert.id !== alertId || alert.firedAt == null || alert.ackedAt != null) return alert
    changed = true
    return { ...alert, ackedAt: now, ackedSmokingMs: smokingMs }
  })
  return changed ? { ...hookah, alerts } : hookah
}

export function acknowledgeEarliest(hookahs: Hookah[], now: number): Hookah[] {
  const stamped = stampDueAlerts(hookahs, now).hookahs
  const earliest = earliestOpenAlert(stamped, now)
  if (!earliest) return stamped === hookahs ? hookahs : stamped
  return stamped.map((hookah) =>
    hookah.id === earliest.hookahId ? acknowledgeAlert(hookah, earliest.alertId, now) : hookah,
  )
}

export interface HookahDraft {
  table: string
  kind: string
  durationMin: number
  warmupMin: number
  elapsedSmokingMin: number
  alertMinutes: number[]
  x: number | null
  y: number | null
  running: boolean
}

function draftElapsedMs(draft: HookahDraft, carriedWarmupMs = 0): number {
  const smoking = Math.max(0, draft.elapsedSmokingMin)
  const warmup = Math.max(0, draft.warmupMin)
  if (smoking > 0) return (warmup + smoking) * 60_000
  return Math.min(Math.max(0, carriedWarmupMs), warmup * 60_000)
}

export function createHookah(draft: HookahDraft, now: number): Hookah {
  const elapsedMs = draftElapsedMs(draft)
  const hookah: Hookah = {
    id: crypto.randomUUID(),
    table: draft.table.trim() || 'Стол',
    kind: draft.kind.trim() || 'Чаша',
    durationMin: Math.max(1, Math.round(draft.durationMin)),
    warmupMin: Math.max(0, Math.round(draft.warmupMin)),
    running: draft.running,
    elapsedBeforeMs: draft.running ? 0 : elapsedMs,
    startedAt: draft.running ? now - elapsedMs : null,
    finishedAt: null,
    alerts: [],
    x: draft.x,
    y: draft.y,
    recordedSessionId: null,
    createdAt: now,
  }
  hookah.alerts = reconcileAlerts([], draft.alertMinutes, timerSnapshot(hookah, now).smokingMs / 60_000, now)
  return hookah
}

export function reconcileAlerts(
  existing: HookahAlert[],
  minutes: number[],
  smokingMin: number,
  now: number,
): HookahAlert[] {
  const intervals = minutes.map((minute) => Math.round(minute)).filter((minute) => minute > 0)
  const result: HookahAlert[] = []
  for (let index = 0; index < intervals.length; index += 1) {
    const atMin = intervals[index]
    const carried = existing[index]?.atMin === atMin ? existing[index] : null
    const prev = index === 0 ? null : result[index - 1]
    const prevReady = index === 0 || prev?.ackedAt != null
    const anchorMin = index === 0 ? 0 : (prev?.ackedSmokingMs ?? Number.POSITIVE_INFINITY) / 60_000
    const due = prevReady && Number.isFinite(anchorMin) && smokingMin + 1e-6 >= anchorMin + atMin
    if (!due) {
      result.push({
        id: carried?.id ?? crypto.randomUUID(),
        atMin,
        firedAt: null,
        ackedAt: null,
        ackedSmokingMs: null,
      })
      continue
    }
    result.push({
      id: carried?.id ?? crypto.randomUUID(),
      atMin,
      firedAt: carried?.firedAt ?? now,
      ackedAt: carried?.ackedAt ?? null,
      ackedSmokingMs: carried?.ackedSmokingMs ?? null,
    })
  }
  return result
}

export function applyDraft(hookah: Hookah, draft: HookahDraft, now: number): Hookah {
  const elapsedMs = draftElapsedMs(draft, totalElapsedMs(hookah, now))
  const durationMin = Math.max(1, Math.round(draft.durationMin))
  const smokingMin = Math.max(0, draft.elapsedSmokingMin)
  const done = smokingMin >= durationMin && smokingMin > 0
  return {
    ...hookah,
    table: draft.table.trim() || 'Стол',
    kind: draft.kind.trim() || 'Чаша',
    durationMin,
    warmupMin: Math.max(0, Math.round(draft.warmupMin)),
    running: done ? false : draft.running,
    elapsedBeforeMs: done || !draft.running ? elapsedMs : 0,
    startedAt: done || !draft.running ? null : now - elapsedMs,
    finishedAt: done ? (hookah.finishedAt ?? now) : null,
    recordedSessionId: done ? hookah.recordedSessionId : null,
    x: draft.x,
    y: draft.y,
    alerts: reconcileAlerts(hookah.alerts, draft.alertMinutes, smokingMin, now),
  }
}

export function toggleRunning(hookah: Hookah, now: number): Hookah {
  if (hookah.finishedAt != null) {
    return {
      ...hookah,
      finishedAt: null,
      recordedSessionId: null,
      running: true,
      startedAt: now,
      elapsedBeforeMs: totalElapsedMs(hookah, now),
    }
  }
  if (hookah.running) return freezeHookah(hookah, now, false)
  return {
    ...hookah,
    running: true,
    startedAt: now,
  }
}

export function isActiveHookah(hookah: Hookah, now: number): boolean {
  const phase = timerSnapshot(hookah, now).phase
  return phase === 'warmup' || phase === 'smoking'
}
