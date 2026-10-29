import { useEffect, useState } from 'react'
import type { HallTable, Hookah } from '../../types'
import type { HookahDraft } from '../../domain/timers'
import { timerSnapshot } from '../../domain/timers'
import { sortedTables, tableOption } from '../../domain/tables'
import { useApp } from '../../store/context'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { AlertSettings } from './AlertSettings'

function toDraft(hookah: Hookah | null, table: string | null, defaults: number[], tables: HallTable[], now: number): HookahDraft {
  const options = sortedTables(tables)
  const fallback = options[0]?.label ?? ''
  if (!hookah) {
    const chosen = table && options.some((item) => item.label === table) ? table : fallback
    return {
      table: chosen,
      flavorName: '',
      kind: '',
      durationMin: 60,
      warmupMin: 0,
      elapsedSmokingMin: 0,
      alertMinutes: defaults.length > 0 ? defaults : [10, 10, 10],
      alertSeconds: (defaults.length > 0 ? defaults : [10, 10, 10]).map(() => 0),
      x: null,
      y: null,
      running: true,
    }
  }
  const snap = timerSnapshot(hookah, now)
  return {
    table: options.some((item) => item.label === hookah.table) ? hookah.table : hookah.table || fallback,
    flavorName: hookah.flavorName,
    kind: hookah.kind,
    durationMin: hookah.durationMin,
    warmupMin: 0,
    elapsedSmokingMin: Math.round(snap.smokingMs / 60_000),
    alertMinutes: hookah.alerts.map((alert) => alert.atMin),
    alertSeconds: hookah.alerts.map((alert) => alert.atSec ?? 0),
    x: hookah.x,
    y: hookah.y,
    running: hookah.finishedAt == null && hookah.running,
  }
}

export function HookahEditor({
  hookah,
  table,
  tables,
  defaults,
  onClose,
  onSave,
}: {
  hookah: Hookah | null
  table: string | null
  tables: HallTable[]
  defaults: number[]
  onClose: () => void
  onSave: (draft: HookahDraft) => void
}) {
  const { setDirty } = useApp()
  const options = sortedTables(tables)
  const [initial] = useState(() => toDraft(hookah, table, defaults, tables, Date.now()))
  const [tableName, setTableName] = useState(initial.table)
  const [flavorName, setFlavorName] = useState(initial.flavorName ?? '')
  const [durationMin, setDurationMin] = useState(String(initial.durationMin))
  const [alerts, setAlerts] = useState(initial.alertMinutes.map(String))
  const [seconds, setSeconds] = useState((initial.alertSeconds ?? []).map(String))
  const [running, setRunning] = useState(initial.running)
  const knownTable = options.some((item) => item.label === tableName)

  useEffect(() => {
    const changed =
      tableName !== initial.table ||
      flavorName !== (initial.flavorName ?? '') ||
      durationMin !== String(initial.durationMin) ||
      running !== initial.running ||
      alerts.join(',') !== initial.alertMinutes.join(',') ||
      seconds.join(',') !== (initial.alertSeconds ?? []).join(',')
    setDirty(changed)
    return () => setDirty(false)
  }, [alerts, durationMin, flavorName, initial, running, seconds, setDirty, tableName])

  return (
    <Modal
      title={hookah ? 'Редактирование кальяна' : 'Новый кальян'}
      heading={
        <input
          className="field modal-title-input"
          placeholder="новый кальян"
          aria-label="Вкус"
          value={flavorName}
          onChange={(event) => setFlavorName(event.target.value)}
        />
      }
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Отмена</Button>
          <Button variant="primary" type="submit" form="hookah-form" disabled={options.length === 0}>
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
          const allowed = options.some((item) => item.label === tableName) || tableName === initial.table
          if (!tableName.trim() || !allowed || !Number.isFinite(duration) || duration < 1) return
          onSave({
            table: tableName,
            flavorName: flavorName.trim(),
            kind: hookah?.kind ?? '',
            durationMin: duration,
            warmupMin: 0,
            elapsedSmokingMin: initial.elapsedSmokingMin,
            alertMinutes: alerts.map(Number).map((minute, index) => {
              const sec = Number(seconds[index])
              const hasSeconds = Number.isFinite(sec) && sec > 0
              if (!Number.isFinite(minute) || minute < 0) return hasSeconds ? 0 : Number.NaN
              return minute
            }),
            alertSeconds: seconds.map((value) => {
              const sec = Number(value)
              if (!Number.isFinite(sec) || sec <= 0) return 0
              return Math.min(59, Math.round(sec))
            }),
            x: initial.x,
            y: initial.y,
            running,
          })
          onClose()
        }}
      >
        <label>
          Стол
          <select className="field" value={knownTable ? tableName : ''} onChange={(event) => setTableName(event.target.value)} required>
            {options.length === 0 ? <option value="">Нет столов в зале</option> : null}
            {!knownTable && tableName ? <option value={tableName}>{tableOption(tableName)}</option> : null}
            {options.map((item) => (
              <option key={item.id} value={item.label}>
                {tableOption(item.label)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Время курения, мин
          <input className="field" inputMode="numeric" value={durationMin} onChange={(event) => setDurationMin(event.target.value)} required />
        </label>
        <label className="check">
          <input type="checkbox" checked={running} onChange={(event) => setRunning(event.target.checked)} />
          Таймер запущен
        </label>
        <AlertSettings
          minutes={alerts}
          seconds={seconds}
          onChange={(nextMinutes, nextSeconds) => {
            setAlerts(nextMinutes)
            setSeconds(nextSeconds)
          }}
        />
      </form>
    </Modal>
  )
}
