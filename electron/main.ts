import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { AppData } from '../src/types'

const MAX_PLAN_BYTES = 8 * 1024 * 1024

let win: BrowserWindow | null = null
let allowClose = false
let pageReady = false

function dir(...parts: string[]): string {
  const target = path.join(app.getPath('userData'), ...parts)
  fs.mkdirSync(target, { recursive: true })
  return target
}

function dbFile(): string {
  return path.join(dir(), 'malewich.json')
}

function planFile(): string {
  return path.join(dir('plans'), 'floor-plan.jpg')
}

function backupDir(): string {
  return dir('backups')
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
}

function readPlanDataUrl(): string | null {
  if (!fs.existsSync(planFile())) return null
  const buffer = fs.readFileSync(planFile())
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#141414',
    title: 'Малевич',
    icon: path.join(__dirname, '../build/icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    pageReady = true
  })

  win.on('close', (event) => {
    if (allowClose || !pageReady) return
    event.preventDefault()
    win?.webContents.send('app:request-close')
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) void win.loadURL(devUrl)
  else void win.loadFile(path.join(__dirname, '../dist-web/index.html'))
}

function pruneBackups(): void {
  const files = fs
    .readdirSync(backupDir())
    .filter((name) => name.endsWith('.json'))
    .sort()
  for (const name of files.slice(0, Math.max(0, files.length - 10))) {
    fs.rmSync(path.join(backupDir(), name), { force: true })
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopAlertLoop()
})

ipcMain.handle('db:load', () => {
  try {
    const file = dbFile()
    if (!fs.existsSync(file)) return { data: null, planDataUrl: readPlanDataUrl() }
    const raw = fs.readFileSync(file, 'utf8')
    const data = JSON.parse(raw) as AppData
    return { data, planDataUrl: readPlanDataUrl() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось прочитать файл'
    return { data: null, planDataUrl: null, error: message }
  }
})

ipcMain.handle('db:save', (_event, data: AppData) => {
  fs.writeFileSync(dbFile(), JSON.stringify(data, null, 2), 'utf8')
})

ipcMain.handle('plan:set', (_event, payload: { fileName: string; dataUrl: string }) => {
  const match = /^data:image\/jpe?g;base64,(.+)$/i.exec(payload.dataUrl)
  if (!match) throw new Error('Нужен файл JPEG')
  const buffer = Buffer.from(match[1], 'base64')
  if (buffer.length > MAX_PLAN_BYTES) throw new Error('JPEG больше 8 МБ')
  if (!isJpeg(buffer)) throw new Error('Файл не похож на JPEG')
  fs.writeFileSync(planFile(), buffer)
})

ipcMain.handle('plan:clear', () => {
  if (fs.existsSync(planFile())) fs.rmSync(planFile())
})

ipcMain.handle('plan:pick', async () => {
  const result = await dialog.showOpenDialog(win!, {
    title: 'План зала',
    filters: [{ name: 'JPEG', extensions: ['jpg', 'jpeg'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const buffer = fs.readFileSync(result.filePaths[0])
  if (buffer.length > MAX_PLAN_BYTES) throw new Error('JPEG больше 8 МБ')
  if (!isJpeg(buffer)) throw new Error('Нужен файл JPEG')
  fs.writeFileSync(planFile(), buffer)
  return {
    fileName: path.basename(result.filePaths[0]),
    dataUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
  }
})

ipcMain.handle('excel:save', async (_event, payload: { fileName: string; base64: string }) => {
  const result = await dialog.showSaveDialog(win!, {
    title: 'Выгрузка Excel',
    defaultPath: payload.fileName,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  })
  if (result.canceled || !result.filePath) return { cancelled: true }
  const filePath = result.filePath.endsWith('.xlsx') ? result.filePath : `${result.filePath}.xlsx`
  fs.writeFileSync(filePath, Buffer.from(payload.base64, 'base64'))
  return { cancelled: false, path: filePath }
})

ipcMain.handle('backup:create', (_event, bundle: { data: AppData; planDataUrl: string | null }) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(backupDir(), `malewich-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(bundle), 'utf8')
  pruneBackups()
  if (fs.existsSync(dbFile())) {
    fs.copyFileSync(dbFile(), path.join(backupDir(), 'malewich-latest.json'))
  }
  return file
})

ipcMain.handle('backup:restore', async () => {
  const result = await dialog.showOpenDialog(win!, {
    title: 'Восстановить копию',
    defaultPath: backupDir(),
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return null
  const parsed = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8')) as {
    data?: AppData
    planDataUrl?: string | null
  }
  const data = parsed.data ?? (parsed as AppData)
  if (parsed.planDataUrl) {
    const match = /^data:image\/jpe?g;base64,(.+)$/i.exec(parsed.planDataUrl)
    if (match) fs.writeFileSync(planFile(), Buffer.from(match[1], 'base64'))
  }
  return { data, planDataUrl: parsed.planDataUrl ?? readPlanDataUrl() }
})

let alertLoop: ReturnType<typeof setInterval> | null = null

function stopAlertLoop(): void {
  if (alertLoop == null) return
  clearInterval(alertLoop)
  alertLoop = null
}

ipcMain.on('alert:loop', (_event, active: boolean) => {
  if (active) {
    if (alertLoop != null) return
    const ding = (): void => {
      try {
        shell.beep()
      } catch {
        /* на этой системе системный сигнал недоступен */
      }
    }
    ding()
    alertLoop = setInterval(ding, 1400)
    return
  }
  stopAlertLoop()
})

ipcMain.handle('notify', (_event, payload: { title: string; body: string }) => {
  const hidden = !win || win.isMinimized() || !win.isFocused()
  if (!hidden) return
  if (!Notification.isSupported()) return
  new Notification({ title: payload.title, body: payload.body }).show()
})

ipcMain.on('app:confirm-close', (_event, allow: boolean) => {
  if (!allow) return
  allowClose = true
  win?.close()
})
