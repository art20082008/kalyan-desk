import type { AppData, FiredAlert, Hookah, HookahAlert, SmokingSession } from '../types'
import { round1 } from './format'

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

  if (smokingMs >= durationMs) {
    return { phase: 'finished', elapsedMs, smokingMs: durationMs, remainingMs: 0, progress: 1 }
  }

  return {
    phase: 'smoking',
    elapsedMs,
    smokingMs,
    remainingMs: durationMs - smokingMs,
    progress: smokingMs / durationMs,
  }
}

export function isAlertDue(hookah: Hookah, alert: HookahAlert, now: number): boolean {
  if (alert.ackedAt != null) return false
  const snap = timerSnapshot(hookah, now)
  if (snap.phase === 'idle' || snap.phase === 'warmup') return false
  return snap.smokingMs / 60_000 + 1e-9 >= alert.atMin
}

export function openAlerts(hookah: Hookah, now: number): HookahAlert[] {
  return hookah.alerts.filter((alert) => isAlertDue(hookah, alert, now))
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
  const actualMin = round1(Math.min(snap.smokingMs / 60_000, hookah.durationMin))
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
  let sessions = data.sessions
  let sessionsChanged = false
  let changed = stamped.hookahs !== data.hookahs
  const hookahs = stamped.hookahs.map((hookah) => {
    if (hookah.finishedAt != null && hookah.recordedSessionId && !hookah.running) return hookah
    const snap = timerSnapshot(hookah, now)
    if (snap.phase !== 'finished') return hookah
    const recorded = recordSession(freezeHookah(hookah, now, true), now)
    if (recorded.session) {
      sessions = [...sessions, recorded.session]
      sessionsChanged = true
    }
    changed = true
    return recorded.hookah
  })

  if (!changed && !sessionsChanged) return { data, fired: stamped.fired }
  return {
    data: { ...data, hookahs, sessions },
    fired: stamped.fired,
  }
}

export function finishHookah(hookah: Hookah, now: number): { hookah: Hookah; session: SmokingSession | null } {
  return recordSession(freezeHookah(hookah, now, true), now)
}

export function acknowledgeAlert(hookah: Hookah, alertId: string, now: number): Hookah {
  let changed = false
  const alerts = hookah.alerts.map((alert) => {
    if (alert.id !== alertId || alert.firedAt == null || alert.ackedAt != null) return alert
    changed = true
    return { ...alert, ackedAt: now }
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
  const used = new Set<string>()
  const unique = [...new Set(minutes.map((m) => Math.round(m)).filter((m) => m > 0))].sort((a, b) => a - b)
  return unique.map((atMin) => {
    const prev = existing.find((alert) => alert.atMin === atMin && !used.has(alert.id))
    if (prev) used.add(prev.id)
    if (smokingMin + 1e-6 >= atMin) {
      return {
        id: prev?.id ?? crypto.randomUUID(),
        atMin,
        firedAt: prev?.firedAt ?? now,
        ackedAt: prev?.ackedAt ?? null,
      }
    }
    return {
      id: prev?.id ?? crypto.randomUUID(),
      atMin,
      firedAt: null,
      ackedAt: null,
    }
  })
}

export function applyDraft(hookah: Hookah, draft: HookahDraft, now: number): Hookah {
  const elapsedMs = draftElapsedMs(draft, totalElapsedMs(hookah, now))
  const durationMin = Math.max(1, Math.round(draft.durationMin))
  const smokingMin = Math.max(0, draft.elapsedSmokingMin)
  const done = smokingMin >= durationMin && smokingMin > 0
  const next: Hookah = {
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
  return next
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
