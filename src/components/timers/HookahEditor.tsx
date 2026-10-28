import { useEffect, useState } from 'react'
import { HOOKAH_KINDS, type Hookah } from '../../types'
import type { HookahDraft } from '../../domain/timers'
import { timerSnapshot } from '../../domain/timers'
import { useApp } from '../../store/context'
import { Modal } from '../ui/Modal'
import { AlertSettings } from './AlertSettings'

function toDraft(hookah: Hookah | null, point: { x: number; y: number } | null, now: number): HookahDraft {
  if (!hookah) {
    return {
      table: 'Стол 1',
      kind: 'Чаша',
      durationMin: 60,
      warmupMin: 5,
      elapsedSmokingMin: 0,
      alertMinutes: [],
      x: point?.x ?? null,
      y: point?.y ?? null,
      running: true,
    }
  }
  const snap = timerSnapshot(hookah, now)
  return {
    table: hookah.table,
    kind: hookah.kind,
    durationMin: hookah.durationMin,
    warmupMin: hookah.warmupMin,
    elapsedSmokingMin: Math.round(snap.smokingMs / 60_000),
    alertMinutes: hookah.alerts.map((alert) => alert.atMin),
    x: hookah.x,
    y: hookah.y,
    running: hookah.finishedAt == null && hookah.running,
  }
}

export function HookahEditor({
  hookah,
  point,
  onClose,
  onSave,
}: {
  hookah: Hookah | null
  point: { x: number; y: number } | null
  onClose: () => void
  onSave: (draft: HookahDraft) => void
}) {
  const { setDirty } = useApp()
  const [initial] = useState(() => toDraft(hookah, point, Date.now()))
  const [table, setTable] = useState(initial.table)
  const [kind, setKind] = useState(initial.kind)
  const [durationMin, setDurationMin] = useState(String(initial.durationMin))
  const [warmupMin, setWarmupMin] = useState(String(initial.warmupMin))
  const [elapsed, setElapsed] = useState(String(initial.elapsedSmokingMin))
  const [alerts, setAlerts] = useState(initial.alertMinutes.map(String))
  const [running, setRunning] = useState(initial.running)

  useEffect(() => {
    const changed =
      table !== initial.table ||
      kind !== initial.kind ||
      durationMin !== String(initial.durationMin) ||
      warmupMin !== String(initial.warmupMin) ||
      elapsed !== String(initial.elapsedSmokingMin) ||
      running !== initial.running ||
      alerts.join(',') !== initial.alertMinutes.join(',')
    setDirty(changed)
    return () => setDirty(false)
  }, [alerts, durationMin, elapsed, initial, kind, running, setDirty, table, warmupMin])

  return (
    <Modal title={hookah ? 'Редактирование кальяна' : 'Новый кальян'} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          const duration = Number(durationMin)
          if (!table.trim() || !Number.isFinite(duration) || duration < 1) return
          onSave({
            table,
            kind,
            durationMin: duration,
            warmupMin: Number(warmupMin) || 0,
            elapsedSmokingMin: Number(elapsed) || 0,
            alertMinutes: alerts.map(Number).filter((minute) => Number.isFinite(minute) && minute > 0),
            x: initial.x,
            y: initial.y,
            running,
          })
          onClose()
        }}
      >
        <label>
          Стол
          <input className="field" value={table} onChange={(event) => setTable(event.target.value)} required />
        </label>
        <label>
          Вид кальяна
          <select className="field" value={kind} onChange={(event) => setKind(event.target.value)}>
            {HOOKAH_KINDS.map((item) => (
              <option key={item}>{item}</option>
            ))}
            {!HOOKAH_KINDS.includes(kind as (typeof HOOKAH_KINDS)[number]) ? <option>{kind}</option> : null}
          </select>
        </label>
        <div className="split">
          <label>
            Время курения, мин
            <input className="field" inputMode="numeric" value={durationMin} onChange={(event) => setDurationMin(event.target.value)} required />
          </label>
          <label>
            Прогрев, мин
            <input className="field" inputMode="numeric" value={warmupMin} onChange={(event) => setWarmupMin(event.target.value)} />
          </label>
        </div>
        <label>
          Уже курит, мин
          <input className="field" inputMode="numeric" value={elapsed} onChange={(event) => setElapsed(event.target.value)} />
        </label>
        <label className="check">
          <input type="checkbox" checked={running} onChange={(event) => setRunning(event.target.checked)} />
          Таймер запущен
        </label>
        <AlertSettings minutes={alerts} onChange={setAlerts} />
        {initial.x != null ? <p className="muted">Точка стоит на плане зала. На одном столе можно поставить несколько кальянов.</p> : null}
        <div className="row end">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn primary">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  )
}
