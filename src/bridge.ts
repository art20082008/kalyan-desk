import type { AppData } from './types'

export interface LoadResult {
  data: AppData | null
  planDataUrl: string | null
  error?: string
}

export interface MalewichBridge {
  load: () => Promise<LoadResult>
  save: (data: AppData) => Promise<void>
  setPlan: (fileName: string, dataUrl: string) => Promise<void>
  clearPlan: () => Promise<void>
  pickPlan: () => Promise<{ fileName: string; dataUrl: string } | null>
  saveExcel: (fileName: string, base64: string) => Promise<{ cancelled: boolean; path?: string }>
  backup: (data: AppData, planDataUrl: string | null) => Promise<string>
  restore: () => Promise<{ data: AppData; planDataUrl: string | null } | null>
  notify: (title: string, body: string) => Promise<void>
  alertLoop: (active: boolean) => void
  onRequestClose: (cb: () => void) => () => void
  confirmClose: (allow: boolean) => void
}
