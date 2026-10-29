import type { MalewichBridge } from '../src/bridge'

/** Заглушка preload-API (window.malewich), чтобы компоненты не ходили в IPC Electron. */
export function createMalewichMock(log: (name: string, ...args: unknown[]) => void = () => {}): MalewichBridge {
  return {
    load: async () => {
      log('load')
      return { data: null, planDataUrl: null }
    },
    save: async (data) => log('save', data),
    setPlan: async (fileName) => log('setPlan', fileName),
    clearPlan: async () => log('clearPlan'),
    pickPlan: async () => null,
    saveExcel: async (fileName) => {
      log('saveExcel', fileName)
      return { cancelled: true }
    },
    backup: async () => 'storybook-backup.json',
    restore: async () => null,
    notify: async (title, body) => log('notify', title, body),
    alertLoop: (active) => log('alertLoop', active),
    onRequestClose: () => () => {},
    confirmClose: (allow) => log('confirmClose', allow),
  }
}
