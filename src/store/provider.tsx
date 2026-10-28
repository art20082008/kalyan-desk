import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppData, UndoMove } from '../types'
import { storage } from '../data/localDb'
import { applyTimerTick } from '../domain/timers'
import { markReminded, REMINDER_TEXT, reminderDue } from '../domain/reminders'
import { playAlertOnce, stopAlertSound } from '../feedback/alertSound'
import { AppStateContext } from './context'

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AppData | null>(null)
  const [planDataUrl, setPlanDataUrl] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [undo, setUndo] = useState<UndoMove | null>(null)
  const [reminder, setReminder] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [closeAsk, setCloseAsk] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const dataRef = useRef<AppData | null>(null)
  const planRef = useRef<string | null>(null)
  const dirtyRef = useRef(false)
  const reminderRef = useRef<string | null>(null)
  dataRef.current = data
  planRef.current = planDataUrl
  dirtyRef.current = dirty

  const showToast = useCallback((text: string) => {
    setToast(text)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    storage
      .load()
      .then((bundle) => {
        if (cancelled) return
        setData(bundle.data)
        setPlanDataUrl(bundle.planDataUrl)
        setError(null)
        setStatus('ready')
      })
      .catch((reason: unknown) => {
        if (cancelled) return
        setError(reason instanceof Error ? reason.message : 'Не удалось прочитать хранилище')
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  useEffect(() => {
    if (status !== 'ready' || !data) return
    const id = window.setTimeout(() => {
      storage
        .save(data)
        .then(() => {
          setSaveError(null)
          setSavedAt(Date.now())
        })
        .catch((reason: unknown) => {
          setSaveError(reason instanceof Error ? reason.message : 'Не удалось сохранить')
        })
    }, 350)
    return () => window.clearTimeout(id)
  }, [data, status])

  useEffect(() => {
    if (status !== 'ready') return
    const id = window.setInterval(() => {
      const current = dataRef.current
      if (!current) return
      const tickNow = Date.now()
      let next = applyTimerTick(current, tickNow)
      if (next.fired.length > 0) {
        const tables = [...new Set(next.fired.map((item) => item.table))].join(', ')
        storage.notify('Малевич', `Проверить кальян: ${tables}`)
        setToast('Проверить кальян')
        if (current.settings.timerSound !== false) playAlertOnce()
      }
      let nextData = next.data
      if (!reminderRef.current && reminderDue(nextData.settings, nextData.flavors, tickNow)) {
        nextData = { ...nextData, settings: markReminded(nextData.settings, tickNow) }
        reminderRef.current = REMINDER_TEXT
        setReminder(REMINDER_TEXT)
        storage.notify('Малевич', REMINDER_TEXT)
      }
      if (nextData !== current) setData(nextData)
      setNow(tickNow)
    }, 1000)
    return () => {
      window.clearInterval(id)
      stopAlertSound()
    }
  }, [status])

  useEffect(() => {
    if (status !== 'ready') return
    const id = window.setInterval(() => {
      const current = dataRef.current
      if (!current) return
      void storage.backup(current, planRef.current)
    }, 15 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [status])

  const shutdown = useCallback(async () => {
    const current = dataRef.current
    if (current) {
      try {
        await storage.save(current)
        await storage.backup(current, planRef.current)
      } catch {
        /* закрытие важнее, копия уже могла быть раньше */
      }
    }
    storage.confirmClose(true)
  }, [])

  useEffect(() => {
    return storage.onRequestClose(() => {
      if (dirtyRef.current) setCloseAsk(true)
      else void shutdown()
    })
  }, [shutdown])

  useEffect(() => {
    if (storage.runtime() !== 'browser') return
    const listener = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', listener)
    return () => window.removeEventListener('beforeunload', listener)
  }, [])

  const update = useCallback((recipe: (current: AppData) => AppData) => {
    setData((current) => (current ? recipe(current) : current))
  }, [])

  const setPlanImage = useCallback(async (file: { fileName: string; dataUrl: string } | null) => {
    if (!file) {
      await storage.clearPlan()
      setPlanDataUrl(null)
      update((current) => ({ ...current, plan: null }))
      return
    }
    await storage.setPlan(file.fileName, file.dataUrl)
    setPlanDataUrl(file.dataUrl)
    update((current) => ({ ...current, plan: { fileName: file.fileName, updatedAt: Date.now() } }))
  }, [update])

  const restore = useCallback(async () => {
    const bundle = await storage.restore()
    if (!bundle) return
    setData(bundle.data)
    setPlanDataUrl(bundle.planDataUrl)
    setStatus('ready')
    setError(null)
    showToast('Данные восстановлены из копии')
  }, [showToast])

  const backupNow = useCallback(async () => {
    const current = dataRef.current
    if (!current) return
    await storage.backup(current, planRef.current)
    showToast('Резервная копия сохранена')
  }, [showToast])

  const dismissReminder = useCallback(() => {
    reminderRef.current = null
    setReminder(null)
  }, [])

  if (status === 'loading') {
    return (
      <main className="gate">
        <p className="eyebrow">Малевич</p>
        <h1>Загружаем данные зала</h1>
        <p className="muted">Таймеры, полка и заявки читаются из локального файла.</p>
      </main>
    )
  }

  if (status === 'error' || !data) {
    return (
      <main className="gate">
        <p className="eyebrow">Малевич</p>
        <h1>Не удалось прочитать хранилище</h1>
        <p className="muted">{error ?? 'Файл данных повреждён'}</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setReloadKey((key) => key + 1)}>
            Повторить
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void restore().catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : 'Копия не прочиталась')
              })
            }}
          >
            Восстановить из копии
          </button>
        </div>
      </main>
    )
  }

  return (
    <AppStateContext.Provider
      value={{
        data,
        planDataUrl,
        now,
        saveError,
        savedAt,
        dirty,
        setDirty,
        undo,
        setUndo,
        reminder,
        dismissReminder,
        runtime: storage.runtime(),
        toast,
        showToast,
        update,
        reload: () => setReloadKey((key) => key + 1),
        restore,
        backupNow,
        setPlanImage,
      }}
    >
      {children}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
      {closeAsk ? (
        <div className="modal-backdrop">
          <div className="modal narrow" role="dialog" aria-modal="true" aria-label="Несохранённые изменения">
            <h2>Есть несохранённые изменения</h2>
            <p>Закрыть приложение? Правки в открытом окне не запишутся.</p>
            <div className="row end">
              <button type="button" className="btn" onClick={() => setCloseAsk(false)}>
                Остаться
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  setDirty(false)
                  dirtyRef.current = false
                  void shutdown()
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppStateContext.Provider>
  )
}
