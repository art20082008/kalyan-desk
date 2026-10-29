import type { Flavor, HallTable, Hookah, HookahAlert } from '../types'

/** Фиксированное «сейчас»: 29.10.2026 21:00 по Таллину. Все состояния считаются от него, без живых часов. */
export const NOW = new Date('2026-10-29T21:00:00+02:00').getTime()
export const MIN = 60_000

export function alert(atMin: number, patch: Partial<HookahAlert> = {}): HookahAlert {
  return { id: `a-${atMin}-${Math.random().toString(36).slice(2, 7)}`, atMin, firedAt: null, ackedAt: null, ackedSmokingMs: null, ...patch }
}

export function hookah(patch: Partial<Hookah> = {}): Hookah {
  return {
    id: 'h-1',
    table: 'Стол 3',
    flavorName: 'Darkside · Supernova',
    kind: 'Чаша',
    durationMin: 60,
    warmupMin: 0,
    running: true,
    elapsedBeforeMs: 0,
    startedAt: NOW - 12 * MIN,
    finishedAt: null,
    alerts: [alert(20), alert(20), alert(20)],
    x: null,
    y: null,
    recordedSessionId: null,
    createdAt: NOW - 15 * MIN,
    ...patch,
  }
}

export const flavors: Flavor[] = [
  { id: 'f1', brand: 'Darkside', name: 'Supernova', status: 'shelf' },
  { id: 'f2', brand: 'Darkside', name: 'Bananapapa', status: 'stop' },
  { id: 'f3', brand: 'Darkside', name: 'Torpedo', status: 'shelf' },
  { id: 'f4', brand: 'MustHave', name: 'Pinkman', status: 'stop' },
  { id: 'f5', brand: 'MustHave', name: 'Lemon-lime', status: 'request' },
  { id: 'f6', brand: 'Black Burn', name: 'Malina', status: 'shelf' },
  { id: 'f7', brand: 'Element', name: 'Груша', status: 'stop' },
]

export const tables: HallTable[] = Array.from({ length: 8 }, (_, i) => ({ id: `t${i + 1}`, label: `Стол ${i + 1}` }))
