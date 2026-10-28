import { createContext, useContext } from 'react'
import type { AppData, UndoMove } from '../types'

export interface AppContextValue {
  data: AppData
  planDataUrl: string | null
  now: number
  saveError: string | null
  savedAt: number | null
  dirty: boolean
  setDirty: (dirty: boolean) => void
  undo: UndoMove | null
  setUndo: (undo: UndoMove | null) => void
  reminder: string | null
  dismissReminder: () => void
  runtime: 'electron' | 'browser'
  toast: string | null
  showToast: (text: string) => void
  update: (recipe: (data: AppData) => AppData) => void
  reload: () => void
  restore: () => Promise<void>
  backupNow: () => Promise<void>
  setPlanImage: (file: { fileName: string; dataUrl: string } | null) => Promise<void>
}

export const AppStateContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('Состояние Малевича ещё не готово')
  return value
}
