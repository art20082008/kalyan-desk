import { describe, expect, it } from 'vitest'
import { brandBreakdown, smokingAverage, topFlavors } from './analytics'
import { hotkeyAction } from './hotkeys'
import { markReminded, reminderDue } from './reminders'
import { addFlavor, forwardFlavor, moveFlavor, recordRequest, undoMove } from './shelf'
import { orderText } from './text'
import {
  acknowledgeEarliest,
  applyTimerTick,
  createHookah,
  earliestOpenAlert,
  finishHookah,
  reactionMs,
  timerSnapshot,
} from './timers'
import { createDefaultData } from '../data/defaults'
import type { Flavor, HookahAlert, OrderRequest, Settings } from '../types'

function hookahAt(elapsedSmokingMin: number, alerts: number[], now: number) {
  return createHookah(
    {
      table: 'Стол 2',
      kind: 'Чаша',
      durationMin: 60,
      warmupMin: 5,
      elapsedSmokingMin,
      alertMinutes: alerts,
      x: null,
      y: null,
      running: true,
    },
    now,
  )
}

describe('таймеры', () => {
  const now = 1_700_000_000_000

  it('считает прогрев отдельно от курения', () => {
    const hookah = hookahAt(0, [], now)
    const atStart = timerSnapshot(hookah, now)
    expect(atStart.phase).toBe('warmup')
    const afterWarmup = timerSnapshot(hookah, now + 5 * 60_000)
    expect(afterWarmup.phase).toBe('smoking')
    expect(afterWarmup.remainingMs).toBe(60 * 60_000)
  })

  it('ставит алерт на свою минуту и пишет время реакции', () => {
    const hookah = hookahAt(0, [20], now)
    const before = timerSnapshot(hookah, now + 24 * 60_000)
    expect(before.phase).toBe('smoking')
    const dueNow = now + (5 + 20) * 60_000
    const stamped = applyTimerTick({ ...createDefaultData(now), hookahs: [hookah] }, dueNow)
    const alert = stamped.data.hookahs[0].alerts[0]
    expect(alert.firedAt).toBe(dueNow)
    const reactionAt = dueNow + 4 * 60_000
    const acked = acknowledgeEarliest(stamped.data.hookahs, reactionAt)
    expect(reactionMs(acked[0].alerts[0], reactionAt)).toBe(4 * 60_000)
    expect(acked[0].alerts[0].ackedAt).toBe(reactionAt)
  })

  it('пробел обновляет самый ранний из нескольких алертов', () => {
    const first = hookahAt(30, [20], now)
    const second = { ...hookahAt(30, [20], now), id: 'later', table: 'Стол 4' }
    const earlyAlert: HookahAlert = { ...first.alerts[0], firedAt: now - 10 * 60_000 }
    const lateAlert: HookahAlert = { ...second.alerts[0], firedAt: now - 2 * 60_000 }
    const hookahs = [
      { ...second, alerts: [lateAlert] },
      { ...first, alerts: [earlyAlert] },
    ]
    expect(earliestOpenAlert(hookahs, now)?.hookahId).toBe(first.id)
    const next = acknowledgeEarliest(hookahs, now)
    expect(next.find((item) => item.id === first.id)?.alerts[0].ackedAt).toBe(now)
    expect(next.find((item) => item.id === 'later')?.alerts[0].ackedAt).toBeNull()
  })

  it('по факту записывает досрочное завершение и ограничивает просрочку планом', () => {
    const hookah = hookahAt(0, [], now)
    const early = finishHookah(hookah, now + (5 + 25) * 60_000)
    expect(early.session?.actualMin).toBe(25)
    const overtime = applyTimerTick(
      { ...createDefaultData(now), hookahs: [hookah] },
      now + (5 + 90) * 60_000,
    )
    expect(overtime.data.sessions[0].actualMin).toBe(60)
    expect(overtime.data.hookahs[0].finishedAt).not.toBeNull()
  })
})

describe('полка', () => {
  it('переносит вкус в заявку и возвращает отменой', () => {
    const added = addFlavor([], 'Darkside', 'Supernova')
    const forward = forwardFlavor(added.flavors, added.flavors[0].id, 10)
    expect(forward.flavors[0].status).toBe('stop')
    const request = moveFlavor(forward.flavors, added.flavors[0].id, 'request', 20)
    expect(request.undo?.from).toBe('stop')
    expect(undoMove(request.flavors, request.undo)[0].status).toBe('stop')
  })

  it('не пускает 501-й вкус', () => {
    const flavors: Flavor[] = Array.from({ length: 500 }, (_, index) => ({
      id: `f${index}`,
      brand: 'Darkside',
      name: `Вкус ${index}`,
      status: 'shelf',
    }))
    expect(addFlavor(flavors, 'Burn', 'Ещё').error).toMatch(/500/)
  })

  it('пишет заявку один раз за минуту для того же состава', () => {
    const data = createDefaultData(1)
    data.flavors = [{ id: 'a', brand: 'Deus', name: 'Red', status: 'request' }]
    const first = recordRequest(data, 1_000)
    const second = recordRequest(first.data, 30_000)
    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.data.requests).toHaveLength(1)
  })
})

describe('история и напоминания', () => {
  it('считает топ, бренды и среднее', () => {
    const requests: OrderRequest[] = [
      {
        id: '1',
        createdAt: 1,
        flavors: [
          { id: 'a', brand: 'Darkside', name: 'Supernova' },
          { id: 'b', brand: 'Deus', name: 'Red' },
        ],
      },
      {
        id: '2',
        createdAt: 2,
        flavors: [{ id: 'a', brand: 'Darkside', name: 'Supernova' }],
      },
    ]
    expect(topFlavors(requests)[0]).toMatchObject({ name: 'Supernova', count: 2 })
    expect(brandBreakdown(requests)[0]).toMatchObject({ brand: 'Darkside', count: 2 })
    expect(
      smokingAverage([
        {
          id: 's',
          hookahId: 'h',
          table: '1',
          kind: 'Чаша',
          startedAt: 0,
          finishedAt: 1,
          plannedMin: 60,
          actualMin: 40,
          reactions: [],
        },
        {
          id: 's2',
          hookahId: 'h2',
          table: '2',
          kind: 'Чаша',
          startedAt: 0,
          finishedAt: 1,
          plannedMin: 60,
          actualMin: 50,
          reactions: [],
        },
      ]).averageMin,
    ).toBe(45)
  })

  it('напоминает раз в неделю или после конца смены', () => {
    const flavors: Flavor[] = [{ id: 'a', brand: 'Burn', name: 'Чай', status: 'stop' }]
    const weekly: Settings = {
      reminder: 'weekly',
      shiftEnd: '23:00',
      weekAnchorAt: 0,
      lastWeeklyReminderAt: 0,
      lastShiftReminderOn: null,
    }
    expect(reminderDue(weekly, flavors, 6 * 24 * 60 * 60 * 1000)).toBe(false)
    expect(reminderDue(weekly, flavors, 8 * 24 * 60 * 60 * 1000)).toBe(true)
    const marked = markReminded(weekly, 8 * 24 * 60 * 60 * 1000)
    expect(reminderDue(marked, flavors, 8 * 24 * 60 * 60 * 1000 + 1000)).toBe(false)

    const evening = new Date(2026, 9, 28, 23, 30).getTime()
    const shift: Settings = { ...weekly, reminder: 'shift', shiftEnd: '23:00', lastShiftReminderOn: null }
    expect(reminderDue(shift, flavors, evening)).toBe(true)
    expect(reminderDue({ ...shift, lastShiftReminderOn: '2026-10-28' }, flavors, evening)).toBe(false)
  })
})

describe('клавиши и текст', () => {
  it('не забирает пробел и Ctrl+C из поля ввода', () => {
    const input = { tagName: 'INPUT' }
    expect(hotkeyAction({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, target: input })).toBeNull()
    expect(hotkeyAction({ key: 'c', ctrlKey: true, metaKey: false, altKey: false, target: input })).toBeNull()
    expect(hotkeyAction({ key: 's', ctrlKey: true, metaKey: false, altKey: false, target: input })).toBe('excel')
    expect(hotkeyAction({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, target: { tagName: 'DIV' } })).toBe('ack')
    expect(hotkeyAction({ key: 'Escape', ctrlKey: false, metaKey: false, altKey: false, target: input })).toBe('close')
    expect(hotkeyAction({ key: 'ArrowRight', ctrlKey: false, metaKey: false, altKey: false, target: { tagName: 'BODY' } })).toBe('next')
  })

  it('собирает текст заявки по брендам', () => {
    const text = orderText(
      [
        { id: '1', brand: 'Deus', name: 'Red' },
        { id: '2', brand: 'Darkside', name: 'Supernova' },
      ],
      new Date(2026, 9, 28, 14, 5).getTime(),
    )
    expect(text).toContain('Darkside')
    expect(text).toContain('— Supernova')
    expect(text.indexOf('Darkside')).toBeLessThan(text.indexOf('Deus'))
  })
})
