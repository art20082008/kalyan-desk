import { useEffect, useState } from 'react'
import { acceptAlertCount, resizeIntervals } from '../domain/alertPresets'
import type { ReminderMode } from '../types'
import { useApp } from '../store/context'
import { AlertStepRow } from './ui/AlertStepRow'
import { Button } from './ui/Button'
import { ChoiceChip } from './ui/ChoiceChip'
import { Modal } from './ui/Modal'
import { RadioOption } from './ui/RadioOption'
import { TextField } from './ui/TextField'

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 7, label: 'Вс' },
]

interface Step {
  minutes: number
  custom: boolean
}

function toSteps(intervals: number[]): Step[] {
  return intervals.map((minutes) => ({
    minutes,
    custom: ![5, 10, 15, 20].includes(minutes),
  }))
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const app = useApp()
  const settings = app.data.settings
  const { setDirty } = app
  const [name, setName] = useState(settings.organizationName)
  const [reminder, setReminder] = useState<ReminderMode>(settings.reminder)
  const [weekDay, setWeekDay] = useState(settings.weekDay)
  const [weekTime, setWeekTime] = useState(settings.weekTime)
  const [shiftEnd, setShiftEnd] = useState(settings.shiftEnd)
  const [steps, setSteps] = useState<Step[]>(() => toSteps(settings.alertIntervals))

  useEffect(() => {
    const dirty =
      name !== settings.organizationName ||
      reminder !== settings.reminder ||
      weekDay !== settings.weekDay ||
      weekTime !== settings.weekTime ||
      shiftEnd !== settings.shiftEnd ||
      steps.map((step) => step.minutes).join(',') !== settings.alertIntervals.join(',')
    setDirty(dirty)
    return () => setDirty(false)
  }, [name, reminder, settings, setDirty, shiftEnd, steps, weekDay, weekTime])

  function saveIntervals(next: Step[]) {
    const alertIntervals = next.map((step) => step.minutes)
    app.update((data) => ({ ...data, settings: { ...data.settings, alertIntervals } }))
  }

  function setCount(text: string) {
    const count = acceptAlertCount(text)
    if (count == null) return
    setSteps((current) => {
      const resized = resizeIntervals(
        current.map((step) => step.minutes),
        count,
      )
      return resized.map((minutes, index) => {
        const prev = current[index]
        if (prev && prev.custom && prev.minutes === minutes) return prev
        return { minutes, custom: ![5, 10, 15, 20].includes(minutes) }
      })
    })
  }

  function saveAll() {
    const organizationName = name.trim() || 'Малевич'
    const alertIntervals = steps.map((step) => step.minutes)
    app.update((data) => ({
      ...data,
      settings: {
        ...data.settings,
        organizationName,
        reminder,
        weekDay,
        weekTime: weekTime || '10:00',
        shiftEnd: shiftEnd || '23:00',
        alertIntervals,
      },
    }))
    app.showToast('Настройки сохранены')
    onClose()
  }

  return (
    <Modal
      title="Настройки"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Закрыть</Button>
          <Button variant="primary" onClick={saveAll}>
            Сохранить
          </Button>
        </>
      }
    >
      <div className="modal-body">
        <div className="settings-block">
          <TextField label="Наименование организации" value={name} onChange={(event) => setName(event.target.value)} />
          <p className="hint">Можно изменить в любой момент</p>
        </div>
        <div className="settings-block">
          <p className="field-label">Напоминание о заявке</p>
          <div className="settings-block">
            <RadioOption label="Раз в неделю" selected={reminder === 'weekly'} onSelect={() => setReminder('weekly')} />
            <div className="week">
              <div>
                <p className="field-label">День недели</p>
                <div className="days">
                  {DAYS.map((day) => (
                    <ChoiceChip key={day.id} selected={weekDay === day.id} onClick={() => setWeekDay(day.id)}>
                      {day.label}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
              <TextField label="Время" type="time" lang="ru-RU" value={weekTime} onChange={(event) => setWeekTime(event.target.value)} />
            </div>
            <RadioOption label="В конце смены" selected={reminder === 'shift'} onSelect={() => setReminder('shift')} />
          </div>
        </div>
        <TextField label="Конец смены" type="time" lang="ru-RU" value={shiftEnd} onChange={(event) => setShiftEnd(event.target.value)} />
        <div className="alert-preset">
          <header>
            <p>
              Предустановки <span>таймеров</span>
            </p>
            <Button
              variant="small"
              onClick={() => {
                saveIntervals(steps)
                app.showToast('Предустановки сохранены')
              }}
            >
              Сохранить по умолчанию
            </Button>
          </header>
          <div className="count-field">
            <TextField
              label="Количество таймеров"
              inputMode="numeric"
              value={String(steps.length)}
              onChange={(event) => setCount(event.target.value)}
            />
            <p className="hint">от 1 до 5</p>
          </div>
          <div className="settings-block">
            {steps.map((step, index) => (
              <AlertStepRow
                key={index}
                index={index}
                minutes={step.minutes}
                custom={step.custom}
                onSelect={(minutes) => {
                  setSteps((current) => current.map((item, itemIndex) => (itemIndex === index ? { minutes, custom: false } : item)))
                }}
                onCustom={(text) => {
                  setSteps((current) =>
                    current.map((item, itemIndex) => {
                      if (itemIndex !== index) return item
                      if (!text) return { minutes: 10, custom: false }
                      const minutes = Number(text)
                      if (!Number.isFinite(minutes) || minutes <= 0) return item
                      return { minutes, custom: true }
                    }),
                  )
                }}
              />
            ))}
          </div>
          <p className="hint">
            Алерты срабатывают по очереди. По умолчанию интервал 10 мин — можно выбрать другой или ввести своё значение.
            «Сохранить по умолчанию» запомнит количество и интервалы для нового кальяна.
          </p>
        </div>
        <div className="note">
          <strong>Где хранятся данные</strong>
          <p>
            {app.runtime === 'electron'
              ? 'Данные лежат в JSON на этом компьютере. Копия пишется каждые 15 минут и при закрытии.'
              : 'Сейчас открыт просмотр в браузере: данные хранятся в localStorage этого окна. В приложении для Windows они сохраняются в файл.'}
          </p>
        </div>
        <div className="row wrap">
          <Button
            onClick={() => {
              void app.backupNow()
            }}
          >
            Сохранить резервную копию
          </Button>
          <Button
            onClick={() => {
              void app.restore().catch((reason: unknown) => {
                app.showToast(reason instanceof Error ? reason.message : 'Копия не прочиталась')
              })
            }}
          >
            Восстановить из копии
          </Button>
        </div>
      </div>
    </Modal>
  )
}
