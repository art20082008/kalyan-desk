import { useEffect, useRef, useState } from 'react'
import type { SectionId } from './types'
import { hotkeyAction, shouldChangeSection } from './domain/hotkeys'
import { useApp } from './store/context'
import { useTimers } from './store/timersStore'
import { HistorySection } from './components/history/HistorySection'
import { SettingsDialog } from './components/SettingsDialog'
import { ShelfSection } from './components/shelf/ShelfSection'
import { TimersSection } from './components/timers/TimersSection'
import { Button } from './components/ui/Button'
import { Icon } from './components/ui/Icon'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'timers', label: 'Ведение кальянов' },
  { id: 'shelf', label: 'Полка' },
  { id: 'history', label: 'История' },
]

export function App() {
  const app = useApp()
  const timers = useTimers()
  const [section, setSection] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const timersRef = useRef(timers)
  const toastRef = useRef(app.showToast)
  timersRef.current = timers
  toastRef.current = app.showToast
  const swipe = useRef<{ x: number; y: number; at: number; pointerType: string; blocked: boolean } | null>(null)
  const name = app.data.settings.organizationName.trim() || 'Малевич'

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
      event.preventDefault()
      if (action === 'prev') setSection((value) => (value + SECTIONS.length - 1) % SECTIONS.length)
      if (action === 'next') setSection((value) => (value + 1) % SECTIONS.length)
      if (action === 'ack') {
        const done = timersRef.current.acknowledgeEarliest()
        if (!done) toastRef.current('Нет таймера, который пора проверить')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">{name}</div>
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
            {app.saveError ? null : <Icon name="check" />}
            {app.saveError ? 'Не сохранено' : 'Все изменения сохранены'}
          </span>
          <Button variant="small" onClick={() => setSettingsOpen(true)}>
            Настройки
          </Button>
        </div>
      </header>
      {app.reminder ? (
        <div className="reminder">
          <p>{app.reminder}</p>
          <div className="row">
            <Button
              variant="primary"
              onClick={() => {
                setSection(1)
                app.dismissReminder()
              }}
            >
              К полке
            </Button>
            <Button onClick={app.dismissReminder}>Позже</Button>
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
            at: Date.now(),
            pointerType: event.pointerType,
            blocked: Boolean(target.closest('input, textarea, select, [data-noswipe]')),
          }
        }}
        onPointerUp={(event) => {
          const start = swipe.current
          swipe.current = null
          if (!start) return
          const dx = event.clientX - start.x
          const selection = window.getSelection()
          if (
            !shouldChangeSection({
              pointerType: start.pointerType,
              blocked: start.blocked,
              dx,
              dy: event.clientY - start.y,
              elapsedMs: Date.now() - start.at,
              hasSelection: Boolean(selection && !selection.isCollapsed && String(selection).trim()),
            })
          ) {
            return
          }
          setSection((value) => {
            const next = value + (dx < 0 ? 1 : -1)
            return Math.min(SECTIONS.length - 1, Math.max(0, next))
          })
        }}
      >
        {section === 0 ? <TimersSection /> : null}
        {section === 1 ? <ShelfSection /> : null}
        {section === 2 ? <HistorySection /> : null}
      </main>
      {settingsOpen ? <SettingsDialog onClose={() => setSettingsOpen(false)} /> : null}
    </div>
  )
}
