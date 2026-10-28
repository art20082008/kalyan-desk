import { useEffect, useState } from 'react'
import { HOOKAH_KINDS, type Hookah } from '../../types'
import type { HookahDraft } from '../../domain/timers'
import { timerSnapshot } from '../../domain/timers'
import { useApp } from '../../store/context'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { AlertSettings } from './AlertSettings'

function toDraft(hookah: Hookah | null, table: string | null, defaults: number[], now: number): HookahDraft {
  if (!hookah) {
    return {
      table: table || 'Стол 1',
      kind: 'Чаша',
      durationMin: 60,
      warmupMin: 5,
      elapsedSmokingMin: 0,
      alertMinutes: defaults.length > 0 ? defaults : [10, 10, 10],
      x: null,
      y: null,
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
  table,
  defaults,
  onClose,
  onSave,
}: {
  hookah: Hookah | null
  table: string | null
  defaults: number[]
  onClose: () => void
  onSave: (draft: HookahDraft) => void
}) {
  const { setDirty } = useApp()
  const [initial] = useState(() => toDraft(hookah, table, defaults, Date.now()))
  const [tableName, setTableName] = useState(initial.table)
  const [kind, setKind] = useState(initial.kind)
  const [durationMin, setDurationMin] = useState(String(initial.durationMin))
  const [warmupMin, setWarmupMin] = useState(String(initial.warmupMin))
  const [elapsed, setElapsed] = useState(String(initial.elapsedSmokingMin))
  const [alerts, setAlerts] = useState(initial.alertMinutes.map(String))
  const [running, setRunning] = useState(initial.running)

  useEffect(() => {
    const changed =
      tableName !== initial.table ||
      kind !== initial.kind ||
      durationMin !== String(initial.durationMin) ||
      warmupMin !== String(initial.warmupMin) ||
      elapsed !== String(initial.elapsedSmokingMin) ||
      running !== initial.running ||
      alerts.join(',') !== initial.alertMinutes.join(',')
    setDirty(changed)
    return () => setDirty(false)
  }, [alerts, durationMin, elapsed, initial, kind, running, setDirty, tableName, warmupMin])

  return (
    <Modal
      title={hookah ? 'Редактирование кальяна' : 'Новый кальян'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            type="submit"
            form="hookah-form"
          >
            Сохранить
          </Button>
        </>
      }
    >
      <form
        id="hookah-form"
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          const duration = Number(durationMin)
          if (!tableName.trim() || !Number.isFinite(duration) || duration < 1) return
          onSave({
            table: tableName,
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
          <input className="field" value={tableName} onChange={(event) => setTableName(event.target.value)} required />
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
      </form>
    </Modal>
  )
}
