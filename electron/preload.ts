import { contextBridge, ipcRenderer } from 'electron'
import type { AppData } from '../src/types'
import type { LoadResult, MalewichBridge } from '../src/bridge'

const api: MalewichBridge = {
  load: (): Promise<LoadResult> => ipcRenderer.invoke('db:load'),
  save: (data: AppData): Promise<void> => ipcRenderer.invoke('db:save', data),
  setPlan: (fileName: string, dataUrl: string): Promise<void> =>
    ipcRenderer.invoke('plan:set', { fileName, dataUrl }),
  clearPlan: (): Promise<void> => ipcRenderer.invoke('plan:clear'),
  pickPlan: (): Promise<{ fileName: string; dataUrl: string } | null> => ipcRenderer.invoke('plan:pick'),
  saveExcel: (fileName: string, base64: string): Promise<{ cancelled: boolean; path?: string }> =>
    ipcRenderer.invoke('excel:save', { fileName, base64 }),
  backup: (data: AppData, planDataUrl: string | null): Promise<string> =>
    ipcRenderer.invoke('backup:create', { data, planDataUrl }),
  restore: (): Promise<{ data: AppData; planDataUrl: string | null } | null> => ipcRenderer.invoke('backup:restore'),
  notify: (title: string, body: string): Promise<void> => ipcRenderer.invoke('notify', { title, body }),
  onRequestClose: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on('app:request-close', listener)
    return () => ipcRenderer.removeListener('app:request-close', listener)
  },
  confirmClose: (allow: boolean): void => {
    ipcRenderer.send('app:confirm-close', allow)
  },
}

contextBridge.exposeInMainWorld('malewich', api)
