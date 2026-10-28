import type { Hookah } from '../../types'
import { timerFace } from '../../domain/timers'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'
import { TagChip } from '../ui/TagChip'

export function TimerCard({
  hookah,
  now,
  focused,
  onEdit,
  onDelete,
  onToggle,
  onFinish,
  onAcknowledge,
}: {
  hookah: Hookah
  now: number
  focused: boolean
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onFinish: () => void
  onAcknowledge: () => void
}) {
  const face = timerFace(hookah, now)
  const alerting = face.visual === 'alert'
  const className = [
    'timer-card',
    alerting && focused ? 'focused' : '',
    alerting && !focused ? 'alert' : '',
    face.visual === 'overtime' ? 'overtime' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={className}>
      {alerting && focused ? (
        <div className="hotkey-inline">
          <span className="hotkey-key">Пробел</span>
          <span>гасит этот стол</span>
        </div>
      ) : null}
      <header className="timer-head">
        <p>{hookah.table}</p>
        <TagChip label={face.tag} tone={face.tagTone} />
      </header>
      <div className="timer-body">
        <div className="timer-main">
          <span className="timer-kind">{hookah.kind}</span>
          <p className={`time ${face.clockTone === 'primary' ? '' : face.clockTone}`.trim()}>{face.clock}</p>
        </div>
        <div className="timer-progress">
          <div className={`bar ${face.barTone === 'brand' ? '' : face.barTone}`.trim()} aria-hidden="true">
            <span style={{ width: `${Math.round(face.progress * 100)}%` }} />
          </div>
          <p className="plan-line">{face.plan}</p>
          {face.detail ? <p className={`detail ${face.detailTone}`}>{face.detail}</p> : null}
        </div>
      </div>
      {face.reaction ? <p className="reaction">{face.reaction}</p> : null}
      <div className="timer-actions">
        <div className="timer-primary">
          {face.showContinue ? (
            <Button variant="primary" onClick={onAcknowledge}>
              Продолжить
              <Icon name="play" />
            </Button>
          ) : null}
          {face.visual !== 'finished' ? (
            <IconButton name={face.running ? 'pause' : 'play'} label={face.running ? 'Пауза' : 'Запустить'} onClick={onToggle} />
          ) : null}
          {face.showFinish ? <Button onClick={onFinish}>Завершить</Button> : null}
        </div>
        <div className="timer-secondary">
          <IconButton name="pencil" label="Изменить" onClick={onEdit} />
          <IconButton name="trash" label="Удалить" danger onClick={onDelete} />
        </div>
      </div>
    </article>
  )
}
