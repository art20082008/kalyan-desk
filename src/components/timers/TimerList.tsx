import type { Hookah } from '../../types'
import { earliestOpenAlert, sortHookahs } from '../../domain/timers'
import { Button } from '../ui/Button'
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
        <p>Поставьте первый кальян — у него свой таймер и вкус.</p>
        <Button variant="primary" onClick={onAdd}>
          Добавить кальян
        </Button>
      </div>
    )
  }

  const focusedId = earliestOpenAlert(hookahs, now)?.hookahId ?? null
  const ordered = sortHookahs(hookahs, now)

  return (
    <div className="timer-grid">
      {ordered.map((hookah) => (
        <TimerCard
          key={hookah.id}
          hookah={hookah}
          now={now}
          focused={focusedId === hookah.id}
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
