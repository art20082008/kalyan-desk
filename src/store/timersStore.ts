import { setAlertLoop } from '../feedback/alertSound'
import type { HookahDraft } from '../domain/timers'
import {
  acknowledgeAlert,
  acknowledgeEarliest,
  applyDraft,
  createHookah,
  earliestOpenAlert,
  finishHookah,
  openAlerts,
  stampDueAlerts,
  toggleRunning,
} from '../domain/timers'
import { useApp } from './context'

export function useTimers() {
  const app = useApp()

  return {
    hookahs: app.data.hookahs,
    plan: app.data.plan,
    planDataUrl: app.planDataUrl,
    now: app.now,
    add(draft: HookahDraft) {
      const now = Date.now()
      const hookah = createHookah(draft, now)
      if (hookah.alerts.some((alert) => alert.firedAt && !alert.ackedAt)) setAlertLoop(true)
      app.update((data) => ({ ...data, hookahs: [...data.hookahs, hookah] }))
    },
    addTable() {
      app.update((data) => {
        const numbers = data.tables.map((table) => {
          const match = /(\d+)\s*$/.exec(table.label)
          return match ? Number(match[1]) : 0
        })
        const next = Math.max(0, ...numbers) + 1
        return {
          ...data,
          tables: [...data.tables, { id: crypto.randomUUID(), label: `Стол ${next}` }],
        }
      })
    },
    save(id: string, draft: HookahDraft) {
      const now = Date.now()
      app.update((data) => ({
        ...data,
        hookahs: data.hookahs.map((hookah) => (hookah.id === id ? applyDraft(hookah, draft, now) : hookah)),
      }))
    },
    remove(id: string) {
      app.update((data) => ({ ...data, hookahs: data.hookahs.filter((hookah) => hookah.id !== id) }))
    },
    toggle(id: string) {
      const now = Date.now()
      app.update((data) => ({
        ...data,
        hookahs: data.hookahs.map((hookah) => (hookah.id === id ? toggleRunning(hookah, now) : hookah)),
      }))
    },
    finish(id: string) {
      const now = Date.now()
      app.update((data) => {
        const hookah = data.hookahs.find((item) => item.id === id)
        if (!hookah) return data
        const result = finishHookah(hookah, now)
        return {
          ...data,
          hookahs: data.hookahs.map((item) => (item.id === id ? result.hookah : item)),
          sessions: result.session ? [...data.sessions, result.session] : data.sessions,
        }
      })
    },
    acknowledge(id: string) {
      const now = Date.now()
      app.update((data) => {
        const hookahs = data.hookahs.map((hookah) => {
          if (hookah.id !== id) return hookah
          const stamped = stampDueAlerts([hookah], now).hookahs[0]
          const alertId = earliestOpenAlert([stamped], now)?.alertId
          return alertId ? acknowledgeAlert(stamped, alertId, now) : hookah
        })
        setAlertLoop(hookahs.some((hookah) => openAlerts(hookah, now).length > 0))
        return { ...data, hookahs }
      })
    },
    acknowledgeEarliest(): boolean {
      const now = Date.now()
      if (!earliestOpenAlert(app.data.hookahs, now)) return false
      app.update((data) => {
        const hookahs = acknowledgeEarliest(data.hookahs, now)
        setAlertLoop(hookahs.some((hookah) => openAlerts(hookah, now).length > 0))
        return hookahs === data.hookahs ? data : { ...data, hookahs }
      })
      return true
    },
    movePin(id: string, x: number, y: number) {
      app.update((data) => ({
        ...data,
        hookahs: data.hookahs.map((hookah) => (hookah.id === id ? { ...hookah, x, y } : hookah)),
      }))
    },
  }
}
