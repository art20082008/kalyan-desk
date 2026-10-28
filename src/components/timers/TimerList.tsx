import type { Hookah } from '../../types'
import { openAlerts, timerSnapshot } from '../../domain/timers'
import { TimerCard } from './TimerCard'

export function TimerList({
  hookahs,
  now,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onFinish,
  onAcknowledge,
}: {
  hookahs: Hookah[]
  now: number
  onAdd: () => void
  onEdit: (hookah: Hookah) => void
  onDelete: (hookah: Hookah) => void
  onToggle: (id: string) => void
  onFinish: (id: string) => void
  onAcknowledge: (id: string) => void
}) {
  if (hookahs.length === 0) {
    return (
      <div className="empty">
        <h3>Нет кальянов</h3>
        <p>Поставьте первый кальян на стол — таймер, вид чаши и алерты задаются отдельно.</p>
        <button type="button" className="btn primary" onClick={onAdd}>
          Добавить
        </button>
      </div>
    )
  }

  const ordered = [...hookahs].sort((a, b) => {
    const alertA = openAlerts(a, now).length > 0 ? 0 : 1
    const alertB = openAlerts(b, now).length > 0 ? 0 : 1
    if (alertA !== alertB) return alertA - alertB
    const phaseA = timerSnapshot(a, now).phase === 'finished' ? 1 : 0
    const phaseB = timerSnapshot(b, now).phase === 'finished' ? 1 : 0
    if (phaseA !== phaseB) return phaseA - phaseB
    return a.table.localeCompare(b.table, 'ru') || a.createdAt - b.createdAt
  })

  return (
    <div className="timer-grid">
      {ordered.map((hookah) => (
        <TimerCard
          key={hookah.id}
          hookah={hookah}
          now={now}
          onEdit={() => onEdit(hookah)}
          onDelete={() => onDelete(hookah)}
          onToggle={() => onToggle(hookah.id)}
          onFinish={() => onFinish(hookah.id)}
          onAcknowledge={() => onAcknowledge(hookah.id)}
        />
      ))}
    </div>
  )
}
