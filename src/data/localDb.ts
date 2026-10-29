import type { AppData } from '../types'
import { createDefaultData, parseAppData } from './defaults'

const DATA_KEY = 'malewich-db-v1'
const PLAN_KEY = 'plan'
const BACKUP_KEY = 'malewich-backup-v1'

export interface Bundle {
  data: AppData
  planDataUrl: string | null
}

function bridge() {
  return typeof window === 'undefined' ? undefined : window.malewich
}

function openPlanDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('malewich', 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB'))
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openPlanDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const request = tx.objectStore('files').get(key)
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('Не удалось прочитать план'))
  })
}

async function idbSet(key: string, value: string | null): Promise<void> {
  const db = await openPlanDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    const store = tx.objectStore('files')
    if (value == null) store.delete(key)
    else store.put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error('Не удалось сохранить план'))
  })
}

function downloadBase64(fileName: string, base64: string): void {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  link.click()
  URL.revokeObjectURL(link.href)
}

async function pickJpegInBrowser(): Promise<{ fileName: string; dataUrl: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,.jpg,.jpeg'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      if (!/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
        resolve(null)
        window.alert('Нужен файл JPEG')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        resolve(null)
        window.alert('JPEG больше 8 МБ')
        return
      }
      const reader = new FileReader()
      reader.onload = () => resolve({ fileName: file.name, dataUrl: String(reader.result) })
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }
    input.click()
  })
}

export const storage = {
  runtime(): 'electron' | 'browser' {
    return bridge() ? 'electron' : 'browser'
  },

  async load(): Promise<Bundle> {
    const api = bridge()
    if (api) {
      const result = await api.load()
      if (result.error) throw new Error(result.error)
      if (!result.data) return { data: createDefaultData(), planDataUrl: result.planDataUrl }
      return { data: parseAppData(result.data), planDataUrl: result.planDataUrl }
    }
    const raw = localStorage.getItem(DATA_KEY)
    const planDataUrl = await idbGet(PLAN_KEY).catch(() => null)
    if (!raw) return { data: createDefaultData(), planDataUrl }
    return { data: parseAppData(JSON.parse(raw)), planDataUrl }
  },

  async save(data: AppData): Promise<void> {
    const api = bridge()
    if (api) {
      await api.save(data)
      return
    }
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  },

  async setPlan(fileName: string, dataUrl: string): Promise<void> {
    const api = bridge()
    if (api) {
      await api.setPlan(fileName, dataUrl)
      return
    }
    await idbSet(PLAN_KEY, dataUrl)
  },

  async clearPlan(): Promise<void> {
    const api = bridge()
    if (api) {
      await api.clearPlan()
      return
    }
    await idbSet(PLAN_KEY, null)
  },

  async pickPlan(): Promise<{ fileName: string; dataUrl: string } | null> {
    const api = bridge()
    if (api) return api.pickPlan()
    return pickJpegInBrowser()
  },

  async saveExcel(fileName: string, base64: string): Promise<string | null> {
    const api = bridge()
    if (api) {
      const result = await api.saveExcel(fileName, base64)
      return result.cancelled ? null : (result.path ?? fileName)
    }
    downloadBase64(fileName, base64)
    return fileName
  },

  async backup(data: AppData, planDataUrl: string | null): Promise<void> {
    const api = bridge()
    if (api) {
      await api.backup(data, planDataUrl)
      return
    }
    const bundle = JSON.stringify({ data, planDataUrl: planDataUrl && planDataUrl.length < 1_500_000 ? planDataUrl : null })
    localStorage.setItem(BACKUP_KEY, bundle)
  },

  async restore(): Promise<Bundle | null> {
    const api = bridge()
    if (api) {
      const result = await api.restore()
      if (!result) return null
      return { data: parseAppData(result.data), planDataUrl: result.planDataUrl }
    }
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) throw new Error('Локальной копии ещё нет')
    const parsed = JSON.parse(raw) as Bundle
    return { data: parseAppData(parsed.data), planDataUrl: parsed.planDataUrl }
  },

  notify(title: string, body: string): void {
    const api = bridge()
    if (api) {
      void api.notify(title, body)
      return
    }
    if (typeof Notification === 'undefined' || !document.hidden) return
    if (Notification.permission === 'granted') new Notification(title, { body })
  },

  onRequestClose(cb: () => void): () => void {
    const api = bridge()
    if (api) return api.onRequestClose(cb)
    const listener = (event: BeforeUnloadEvent) => {
      cb()
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', listener)
    return () => window.removeEventListener('beforeunload', listener)
  },

  confirmClose(allow: boolean): void {
    bridge()?.confirmClose(allow)
  },
}
