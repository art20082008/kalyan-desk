import type { Hookah } from '../../types'
import { formatClock, formatReaction } from '../../domain/format'
import { openAlerts, reactionMs, timerSnapshot } from '../../domain/timers'

export function TimerCard({
  hookah,
  now,
  onEdit,
  onDelete,
  onToggle,
  onFinish,
  onAcknowledge,
}: {
  hookah: Hookah
  now: number
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onFinish: () => void
  onAcknowledge: () => void
}) {
  const snap = timerSnapshot(hookah, now)
  const alerts = openAlerts(hookah, now)
  const earliest = alerts.reduce<typeof alerts[number] | null>((best, alert) => {
    if (!best) return alert
    return (alert.firedAt ?? now) < (best.firedAt ?? now) ? alert : best
  }, null)
  const waiting = earliest ? reactionMs(earliest, now) : null
  const phaseLabel =
    snap.phase === 'warmup' ? 'Прогрев' : snap.phase === 'finished' ? 'Готово' : snap.phase === 'idle' ? 'Не запущен' : 'Курение'
  const acked = hookah.alerts.filter((alert) => alert.ackedAt && alert.firedAt)

  return (
    <article className={alerts.length > 0 ? 'timer-card alerting' : 'timer-card'}>
      <header className="timer-head">
        <div>
          <p className="eyebrow">{hookah.table}</p>
          <h3>{hookah.kind}</h3>
        </div>
        <span className={alerts.length > 0 ? 'pill danger' : 'pill'}>{phaseLabel}</span>
      </header>
      <p className="time">{formatClock(snap.remainingMs)}</p>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${Math.round(snap.progress * 100)}%` }} />
      </div>
      <p className="muted">
        {snap.phase === 'warmup'
          ? `До курения ${formatClock(snap.remainingMs)} · сессия ${hookah.durationMin} мин`
          : `${Math.round(snap.progress * 100)}% · план ${hookah.durationMin} мин`}
      </p>
      {earliest && waiting != null ? (
        <div className="alert-banner">
          <div>
            <strong>Алерт на {earliest.atMin} мин</strong>
            <p>Без реакции {formatReaction(waiting)}</p>
          </div>
          <button type="button" className="btn primary" onClick={onAcknowledge}>
            Обновить
          </button>
        </div>
      ) : null}
      {acked.length > 0 ? (
        <p className="muted">
          Реакция: {acked.map((alert) => `${alert.atMin} мин — ${formatReaction(alert.ackedAt! - alert.firedAt!)}`).join(', ')}
        </p>
      ) : null}
      <div className="row wrap">
        {snap.phase !== 'finished' ? (
          <button type="button" className="btn" onClick={onToggle}>
            {hookah.running ? 'Пауза' : 'Продолжить'}
          </button>
        ) : null}
        {snap.phase === 'warmup' || snap.phase === 'smoking' ? (
          <button type="button" className="btn" onClick={onFinish}>
            Завершить
          </button>
        ) : null}
        <button type="button" className="btn" onClick={onEdit}>
          Изменить
        </button>
        <button type="button" className="btn danger" onClick={onDelete}>
          Удалить
        </button>
      </div>
    </article>
  )
}
