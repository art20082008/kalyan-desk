import { describe, expect, it } from 'vitest'
import { brandBreakdown, smokingAverage, topFlavors } from './analytics'
import { hotkeyAction, shouldChangeSection } from './hotkeys'
import { markReminded, reminderDue } from './reminders'
import { closeShift } from './shift'
import { addFlavor, forwardFlavor, moveFlavor, recordRequest, undoMove } from './shelf'
import { orderText } from './text'
import { acceptAlertCount } from './alertPresets'
import {
  acknowledgeEarliest,
  alertsCleared,
  applyTimerTick,
  createHookah,
  earliestOpenAlert,
  finishHookah,
  isAlertDue,
  overtimeMs,
  reactionMs,
  sortHookahs,
  timerFace,
  timerSnapshot,
} from './timers'
import { localDateKey } from './format'
import { parseAppData } from '../data/defaults'
import { createDefaultData } from '../data/defaults'
import type { Flavor, HookahAlert, OrderRequest, Settings } from '../types'

function hookahAt(elapsedSmokingMin: number, alerts: number[], now: number) {
  return createHookah(
    {
      table: 'Стол 2',
      kind: 'Чаша',
      durationMin: 60,
      warmupMin: 0,
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

  it('не даёт новому кальяну прогрев', () => {
    const hookah = hookahAt(0, [], now)
    expect(hookah.warmupMin).toBe(0)
    const atStart = timerSnapshot(hookah, now)
    expect(atStart.phase).toBe('smoking')
    expect(atStart.remainingMs).toBe(60 * 60_000)
  })

  it('ставит алерт на свою минуту и пишет время реакции', () => {
    const hookah = hookahAt(0, [20], now)
    const before = timerSnapshot(hookah, now + 19 * 60_000)
    expect(before.phase).toBe('smoking')
    const dueNow = now + 20 * 60_000
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

  it('по факту записывает досрочное завершение и не закрывает кальян сам после плана', () => {
    const hookah = hookahAt(0, [], now)
    const early = finishHookah(hookah, now + 25 * 60_000)
    expect(early.session?.actualMin).toBe(25)
    const overtime = applyTimerTick(
      { ...createDefaultData(now), hookahs: [hookah] },
      now + 90 * 60_000,
    )
    expect(overtime.data.sessions).toHaveLength(0)
    expect(overtime.data.hookahs[0].finishedAt).toBeNull()
    expect(overtime.data.hookahs[0].running).toBe(true)
    expect(finishHookah(hookah, now + 90 * 60_000).session?.actualMin).toBe(90)
  })

  it('ведёт алерты по очереди и отсчитывает следующий интервал от подтверждения', () => {
    const hookah = hookahAt(0, [10, 15, 25], now)
    expect(hookah.alerts.map((alert) => alert.atMin)).toEqual([10, 15, 25])
    const fireAt = now + 10 * 60_000
    const stamped = applyTimerTick({ ...createDefaultData(now), hookahs: [hookah] }, fireAt)
    const first = stamped.data.hookahs[0]
    expect(first.alerts[0].firedAt).toBe(fireAt)
    expect(first.alerts[1].firedAt).toBeNull()
    expect(isAlertDue(first, first.alerts[1], fireAt + 30 * 60_000)).toBe(false)
    expect(timerFace(first, fireAt)).toMatchObject({
      visual: 'alert',
      pulsing: true,
      detail: 'Таймер 1 из 3 сработал',
      tag: 'Таймер',
    })
    const ackedAt = fireAt + 2 * 60_000
    const acked = acknowledgeEarliest(stamped.data.hookahs, ackedAt)
    expect(acked[0].alerts[0].ackedSmokingMs).toBe(12 * 60_000)
    expect(isAlertDue(acked[0], acked[0].alerts[1], ackedAt + 14 * 60_000)).toBe(false)
    const due = ackedAt + 15 * 60_000
    const second = applyTimerTick({ ...createDefaultData(now), hookahs: acked }, due)
    expect(second.data.hookahs[0].alerts[1].firedAt).toBe(due)
    expect(second.data.hookahs[0].alerts[2].firedAt).toBeNull()
  })

  it('после последнего алерта считает сверх плана от нажатия и оставляет кальян открытым', () => {
    const hookah = hookahAt(0, [10], now)
    const fireAt = now + 10 * 60_000
    const stamped = applyTimerTick({ ...createDefaultData(now), hookahs: [hookah] }, fireAt)
    const acked = acknowledgeEarliest(stamped.data.hookahs, fireAt)
    expect(alertsCleared(acked[0])).toBe(true)
    expect(overtimeMs(acked[0], fireAt + 5 * 60_000)).toBe(5 * 60_000)
    expect(timerFace(acked[0], fireAt + 5 * 60_000)).toMatchObject({
      visual: 'overtime',
      clock: '+05:00',
      tag: 'Сверх плана',
      showContinue: true,
    })
    const later = applyTimerTick({ ...createDefaultData(now), hookahs: acked }, fireAt + 80 * 60_000)
    expect(later.data.hookahs[0].finishedAt).toBeNull()
    expect(later.data.sessions).toHaveLength(0)
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

  it('кладёт закончившийся вкус в текст заявки', () => {
    const added = addFlavor([], 'Darkside', 'Supernova')
    const stopped = moveFlavor(added.flavors, added.flavors[0].id, 'stop', 10)
    const data = { ...createDefaultData(1), flavors: stopped.flavors }
    const recorded = recordRequest(data, 2_000)
    expect(recorded.data.requests[0].flavors[0]).toMatchObject({ brand: 'Darkside', name: 'Supernova' })
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
      lastWeeklyReminderAt: null,
      lastShiftReminderOn: null,
      organizationName: 'Малевич',
      weekDay: 1,
      weekTime: '10:00',
      alertIntervals: [10, 10, 10],
      timerSound: true,
    }
    const monday = new Date(2026, 9, 26, 10, 5).getTime()
    const mondayEarly = new Date(2026, 9, 26, 9, 30).getTime()
    const tuesday = new Date(2026, 9, 27, 12, 0).getTime()
    expect(reminderDue(weekly, flavors, mondayEarly)).toBe(false)
    expect(reminderDue(weekly, flavors, tuesday)).toBe(false)
    expect(reminderDue(weekly, flavors, monday)).toBe(true)
    const marked = markReminded(weekly, monday)
    expect(reminderDue(marked, flavors, monday + 60_000)).toBe(false)

    const evening = new Date(2026, 9, 28, 23, 30).getTime()
    const shift: Settings = { ...weekly, reminder: 'shift', shiftEnd: '23:00', lastShiftReminderOn: null }
    expect(reminderDue(shift, flavors, evening)).toBe(true)
    expect(reminderDue({ ...shift, lastShiftReminderOn: '2026-10-28' }, flavors, evening)).toBe(false)
  })
})

describe('клавиши и текст', () => {
  it('оставляет пробел и стрелки только вне поля ввода', () => {
    const input = { tagName: 'INPUT' }
    const plain = { tagName: 'DIV' }
    expect(hotkeyAction({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, target: input })).toBeNull()
    expect(hotkeyAction({ key: 'ArrowLeft', ctrlKey: false, metaKey: false, altKey: false, target: input })).toBeNull()
    expect(hotkeyAction({ key: 'ArrowRight', ctrlKey: false, metaKey: false, altKey: false, target: input })).toBeNull()
    expect(hotkeyAction({ key: ' ', ctrlKey: false, metaKey: false, altKey: false, target: plain })).toBe('ack')
    expect(hotkeyAction({ key: 'ArrowRight', ctrlKey: false, metaKey: false, altKey: false, target: plain })).toBe('next')
    expect(hotkeyAction({ key: 'ArrowLeft', ctrlKey: false, metaKey: false, altKey: false, target: plain })).toBe('prev')
    expect(hotkeyAction({ key: 'Escape', ctrlKey: false, metaKey: false, altKey: false, target: plain })).toBeNull()
    expect(hotkeyAction({ key: 's', ctrlKey: true, metaKey: false, altKey: false, target: plain })).toBeNull()
    expect(hotkeyAction({ key: 'c', ctrlKey: true, metaKey: false, altKey: false, target: plain })).toBeNull()
  })

  it('не забирает пробел у поля ввода и у кнопки', () => {
    const press = (key: string, target: object) =>
      hotkeyAction({ key, ctrlKey: false, metaKey: false, altKey: false, target })
    for (const tagName of ['TEXTAREA', 'SELECT', 'input', 'textarea', 'select']) {
      expect(press(' ', { tagName })).toBeNull()
      expect(press('ArrowLeft', { tagName })).toBeNull()
      expect(press('ArrowRight', { tagName })).toBeNull()
    }
    const editable = { tagName: 'DIV', isContentEditable: true }
    expect(press(' ', editable)).toBeNull()
    expect(press('ArrowLeft', editable)).toBeNull()
    expect(press('ArrowRight', editable)).toBeNull()
    expect(press(' ', { tagName: 'BUTTON' })).toBeNull()
    expect(press('ArrowRight', { tagName: 'BUTTON' })).toBe('next')
    const insideButton = {
      tagName: 'SPAN',
      closest: (selector: string) => (selector.includes('button') ? {} : null),
    }
    expect(press(' ', insideButton)).toBeNull()
  })

  it('не принимает число алертов вне диапазона 1–5 и дополняет старые данные', () => {
    expect(acceptAlertCount('0')).toBeNull()
    expect(acceptAlertCount('6')).toBeNull()
    expect(acceptAlertCount('')).toBeNull()
    expect(acceptAlertCount('3')).toBe(3)
    const raw = createDefaultData(1)
    raw.hookahs = [
      createHookah(
        {
          table: 'VIP',
          kind: 'Чаша',
          durationMin: 60,
          warmupMin: 0,
          elapsedSmokingMin: 0,
          alertMinutes: [10],
          x: null,
          y: null,
          running: false,
        },
        1,
      ),
    ]
    const stored = JSON.parse(JSON.stringify(raw)) as {
      settings: Record<string, unknown>
      tables?: unknown
      hookahs: { alerts: Record<string, unknown>[] }[]
    }
    delete stored.settings.organizationName
    delete stored.settings.alertIntervals
    delete stored.settings.weekDay
    delete stored.settings.weekTime
    delete stored.tables
    delete stored.hookahs[0].alerts[0].ackedSmokingMs
    const parsed = parseAppData(stored, 1)
    expect(parsed.settings.organizationName).toBe('Малевич')
    expect(parsed.settings.alertIntervals).toEqual([10, 10, 10])
    expect(parsed.settings.weekDay).toBe(1)
    expect(parsed.settings.weekTime).toBe('10:00')
    expect(parsed.tables.some((table) => table.label === 'VIP')).toBe(true)
    expect(parsed.tables.some((table) => table.label === 'Стол 1')).toBe(true)
    expect(parsed.hookahs[0].alerts[0].ackedSmokingMs).toBeNull()
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

  it('не меняет раздел, когда текст выделяют мышкой', () => {
    expect(
      shouldChangeSection({ pointerType: 'mouse', blocked: false, dx: -200, dy: 4, elapsedMs: 180, hasSelection: true }),
    ).toBe(false)
    expect(
      shouldChangeSection({ pointerType: 'mouse', blocked: false, dx: -200, dy: 4, elapsedMs: 180, hasSelection: false }),
    ).toBe(false)
    expect(
      shouldChangeSection({ pointerType: 'touch', blocked: false, dx: -200, dy: 10, elapsedMs: 800, hasSelection: false }),
    ).toBe(false)
    expect(
      shouldChangeSection({ pointerType: 'touch', blocked: false, dx: -200, dy: 10, elapsedMs: 120, hasSelection: false }),
    ).toBe(true)
  })

  it('ставит ближайший кальян первым и закрывает смену', () => {
    const now = 1_700_000_000_000
    const soon = { ...hookahAt(0, [5], now), id: 'soon', createdAt: now + 2 }
    const later = { ...hookahAt(0, [20], now), id: 'later', createdAt: now + 1 }
    const ordered = sortHookahs([later, soon], now + 5 * 60_000)
    expect(ordered.map((item) => item.id)).toEqual(['soon', 'later'])
    const data = { ...createDefaultData(now), hookahs: [soon, later] }
    const closed = closeShift(data, now + 6 * 60_000)
    expect(closed.shift.hookahCount).toBe(2)
    expect(closed.shift.dateKey).toBe(localDateKey(now + 6 * 60_000))
    expect(closed.data.hookahs).toHaveLength(0)
    expect(closed.data.shifts).toHaveLength(1)
  })

  it('срабатывает через секунды, без минут', () => {
    const now = 1_700_000_000_000
    const hookah = createHookah(
      {
        table: 'Стол 1',
        kind: '',
        durationMin: 60,
        warmupMin: 5,
        elapsedSmokingMin: 0,
        alertMinutes: [0],
        alertSeconds: [30],
        x: null,
        y: null,
        running: true,
      },
      now,
    )
    expect(hookah.warmupMin).toBe(0)
    expect(hookah.alerts[0]).toMatchObject({ atMin: 0, atSec: 30 })
    expect(isAlertDue(hookah, hookah.alerts[0], now + 29_000)).toBe(false)
    expect(isAlertDue(hookah, hookah.alerts[0], now + 30_000)).toBe(true)
  })
})
