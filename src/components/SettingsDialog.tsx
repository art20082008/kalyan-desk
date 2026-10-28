import { useEffect, useState } from 'react'
import { useHistory } from '../store/historyStore'
import { useApp } from '../store/context'
import { Modal } from './ui/Modal'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const history = useHistory()
  const app = useApp()
  const { setDirty } = app
  const [reminder, setReminder] = useState(history.settings.reminder)
  const [shiftEnd, setShiftEnd] = useState(history.settings.shiftEnd)

  useEffect(() => {
    const dirty = reminder !== history.settings.reminder || shiftEnd !== history.settings.shiftEnd
    setDirty(dirty)
    return () => setDirty(false)
  }, [history.settings.reminder, history.settings.shiftEnd, reminder, setDirty, shiftEnd])

  return (
    <Modal title="Настройки" onClose={onClose} narrow>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          history.setReminder(reminder, shiftEnd)
          app.showToast('Настройки сохранены')
          onClose()
        }}
      >
        <fieldset className="alerts">
          <legend>Напоминание о заявке</legend>
          <label className="check">
            <input type="radio" name="reminder" checked={reminder === 'weekly'} onChange={() => setReminder('weekly')} />
            Раз в неделю
          </label>
          <label className="check">
            <input type="radio" name="reminder" checked={reminder === 'shift'} onChange={() => setReminder('shift')} />
            В конце смены
          </label>
          {reminder === 'shift' ? (
            <label>
              Конец смены
              <input className="field" type="time" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} />
            </label>
          ) : (
            <p className="muted">Если есть закончившиеся вкусы, напомним через 7 дней после прошлого раза.</p>
          )}
        </fieldset>
        <p className="muted">
          {app.runtime === 'electron'
            ? 'Данные лежат в JSON на этом компьютере. Копия пишется каждые 15 минут и при закрытии.'
            : 'Сейчас открыт браузерный просмотр: данные в localStorage этого окна. В приложении Windows они пишутся в файл.'}
        </p>
        <div className="row wrap">
          <button
            type="button"
            className="btn"
            onClick={() => {
              void app.backupNow()
            }}
          >
            Сохранить копию
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void app.restore().catch((reason: unknown) => {
                app.showToast(reason instanceof Error ? reason.message : 'Копия не прочиталась')
              })
            }}
          >
            Восстановить из копии
          </button>
        </div>
        <div className="row end">
          <button type="button" className="btn" onClick={onClose}>
            Закрыть
          </button>
          <button type="submit" className="btn primary">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  )
}
