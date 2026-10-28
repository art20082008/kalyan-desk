import type { FlavorStatus } from '../types'
import { requestWorkbook } from '../domain/excel'
import { formatStamp } from '../domain/format'
import { addFlavor, forwardFlavor, moveFlavor, recordRequest, removeFlavor, undoMove } from '../domain/shelf'
import { orderText } from '../domain/text'
import { starterFlavors } from '../domain/starter'
import { storage } from '../data/localDb'
import { useApp } from './context'

export function useShelf() {
  const app = useApp()
  const requestLines = app.data.flavors.filter((flavor) => flavor.status === 'request')

  function rememberRequest() {
    const now = Date.now()
    app.update((data) => recordRequest(data, now).data)
  }

  return {
    flavors: app.data.flavors,
    undo: app.undo,
    requestLines,
    move(id: string, to: FlavorStatus) {
      const now = Date.now()
      let undo = app.undo
      app.update((data) => {
        const result = moveFlavor(data.flavors, id, to, now)
        undo = result.undo
        return { ...data, flavors: result.flavors }
      })
      app.setUndo(undo)
    },
    forward(id: string) {
      const now = Date.now()
      let undo = app.undo
      app.update((data) => {
        const result = forwardFlavor(data.flavors, id, now)
        undo = result.undo
        return { ...data, flavors: result.flavors }
      })
      app.setUndo(undo)
    },
    undoLast() {
      const current = app.undo
      if (!current) return
      app.update((data) => ({ ...data, flavors: undoMove(data.flavors, current) }))
      app.setUndo(null)
      app.showToast('Перенос отменён')
    },
    add(brand: string, name: string): string | null {
      let error: string | null = null
      app.update((data) => {
        const result = addFlavor(data.flavors, brand, name)
        error = result.error
        return result.error ? data : { ...data, flavors: result.flavors }
      })
      return error
    },
    remove(id: string) {
      app.update((data) => ({ ...data, flavors: removeFlavor(data.flavors, id) }))
    },
    loadStarter() {
      app.update((data) => {
        if (data.flavors.length > 0) return data
        return { ...data, flavors: starterFlavors() }
      })
    },
    async exportExcel(): Promise<boolean> {
      if (requestLines.length === 0) {
        app.showToast('В заявке нет вкусов')
        return false
      }
      const now = Date.now()
      const base64 = requestWorkbook(requestLines, now)
      const saved = await storage.saveExcel(`zayavka-${formatStamp(now)}.xlsx`, base64)
      if (!saved) return false
      rememberRequest()
      app.showToast('Заявка выгружена в Excel')
      return true
    },
    async copyText(): Promise<boolean> {
      if (requestLines.length === 0) {
        app.showToast('В заявке нет вкусов')
        return false
      }
      const text = orderText(requestLines, Date.now())
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        const area = document.createElement('textarea')
        area.value = text
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        area.remove()
      }
      rememberRequest()
      app.showToast('Текст заявки скопирован')
      return true
    },
  }
}
