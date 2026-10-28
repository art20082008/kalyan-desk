import { useEffect, useRef, useState } from 'react'
import type { SectionId } from './types'
import { hotkeyAction } from './domain/hotkeys'
import { useApp } from './store/context'
import { useShelf } from './store/shelfStore'
import { useTimers } from './store/timersStore'
import { HistorySection } from './components/history/HistorySection'
import { SettingsDialog } from './components/SettingsDialog'
import { ShelfSection } from './components/shelf/ShelfSection'
import { TimersSection } from './components/timers/TimersSection'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'timers', label: 'Ведение кальянов' },
  { id: 'shelf', label: 'Полка' },
  { id: 'history', label: 'История' },
]

export function App() {
  const app = useApp()
  const timers = useTimers()
  const shelf = useShelf()
  const [section, setSection] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [closeSignal, setCloseSignal] = useState(0)
  const [seenClose, setSeenClose] = useState(0)
  const timersRef = useRef(timers)
  const shelfRef = useRef(shelf)
  const toastRef = useRef(app.showToast)
  timersRef.current = timers
  shelfRef.current = shelf
  toastRef.current = app.showToast
  const swipe = useRef<{ x: number; y: number; blocked: boolean } | null>(null)

  if (seenClose !== closeSignal) {
    setSeenClose(closeSignal)
    setSettingsOpen(false)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = hotkeyAction({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        target: event.target,
      })
      if (!action) return
      if (action !== 'close') event.preventDefault()
      if (action === 'close') setCloseSignal((value) => value + 1)
      if (action === 'prev') setSection((value) => (value + SECTIONS.length - 1) % SECTIONS.length)
      if (action === 'next') setSection((value) => (value + 1) % SECTIONS.length)
      if (action === 'ack') {
        const done = timersRef.current.acknowledgeEarliest()
        if (!done) toastRef.current('Нет алертов, которые ждут реакции')
      }
      if (action === 'excel') void shelfRef.current.exportExcel()
      if (action === 'copy') void shelfRef.current.copyText()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <strong>Малевич</strong>
          <span>кальянная</span>
        </div>
        <nav className="tabs" aria-label="Разделы">
          {SECTIONS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={section === index ? 'tab active' : 'tab'}
              aria-current={section === index ? 'page' : undefined}
              onClick={() => setSection(index)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <span className={app.saveError ? 'save bad' : 'save'}>
            {app.saveError ? 'Не сохранено' : app.savedAt ? 'Сохранено' : 'Локально'}
          </span>
          <button type="button" className="btn" onClick={() => setSettingsOpen(true)}>
            Настройки
          </button>
        </div>
      </header>
      {app.reminder ? (
        <div className="reminder">
          <p>{app.reminder}</p>
          <div className="row">
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setSection(1)
                app.dismissReminder()
              }}
            >
              К полке
            </button>
            <button type="button" className="btn" onClick={app.dismissReminder}>
              Позже
            </button>
          </div>
        </div>
      ) : null}
      <main
        className="workspace"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement
          swipe.current = {
            x: event.clientX,
            y: event.clientY,
            blocked: Boolean(target.closest('input, textarea, select, [data-noswipe]')),
          }
        }}
        onPointerUp={(event) => {
          const start = swipe.current
          swipe.current = null
          if (!start || start.blocked) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.4) return
          setSection((value) => {
            const next = value + (dx < 0 ? 1 : -1)
            return Math.min(SECTIONS.length - 1, Math.max(0, next))
          })
        }}
      >
        {section === 0 ? <TimersSection closeSignal={closeSignal} /> : null}
        {section === 1 ? <ShelfSection /> : null}
        {section === 2 ? <HistorySection /> : null}
      </main>
      <footer className="hint">Пробел — самый ранний алерт · Ctrl+S — Excel · Ctrl+C — текст заявки · Esc — закрыть · ← → разделы</footer>
      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
