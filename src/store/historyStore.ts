import { analyticsWorkbook } from '../domain/excel'
import { brandBreakdown, currentEnded, smokingAverage, topFlavors } from '../domain/analytics'
import { formatStamp } from '../domain/format'
import { storage } from '../data/localDb'
import { useApp } from './context'

export function useHistory() {
  const app = useApp()
  const requests = app.data.requests
  const sessions = app.data.sessions
  const flavors = app.data.flavors

  return {
    requests,
    sessions,
    settings: app.data.settings,
    top: topFlavors(requests),
    brands: brandBreakdown(requests),
    ended: currentEnded(flavors),
    smoking: smokingAverage(sessions),
    shifts: app.data.shifts ?? [],
    setReminder(reminder: 'weekly' | 'shift', shiftEnd: string) {
      app.update((data) => ({
        ...data,
        settings: {
          ...data.settings,
          reminder,
          shiftEnd,
        },
      }))
    },
    async exportAnalytics(): Promise<void> {
      const now = Date.now()
      const base64 = analyticsWorkbook(requests, flavors, sessions, now)
      const saved = await storage.saveExcel(`analitika-${formatStamp(now)}.xlsx`, base64)
      if (saved) app.showToast('Аналитика выгружена в Excel')
    },
  }
}
