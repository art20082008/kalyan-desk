export function AlertSettings({
  minutes,
  seconds,
  onChange,
}: {
  minutes: string[]
  seconds: string[]
  onChange: (minutes: string[], seconds: string[]) => void
}) {
  return (
    <fieldset className="alerts">
      <legend>Таймеры</legend>
      <p className="muted">Интервалы по очереди, с секундами. Следующий отсчитывается от пробела или «Продолжить».</p>
      {minutes.length === 0 ? <p className="muted">Пока нет таймеров.</p> : null}
      <ul className="alert-list">
        {minutes.map((minute, index) => (
          <li key={index}>
            <label>
              Мин
              <input
                className="field"
                inputMode="numeric"
                value={minute}
                onChange={(event) => {
                  const next = [...minutes]
                  next[index] = event.target.value
                  onChange(next, seconds)
                }}
              />
            </label>
            <label>
              Сек
              <input
                className="field"
                inputMode="numeric"
                value={seconds[index] ?? '0'}
                onChange={(event) => {
                  const next = [...seconds]
                  next[index] = event.target.value
                  onChange(minutes, next)
                }}
              />
            </label>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                onChange(
                  minutes.filter((_, item) => item !== index),
                  seconds.filter((_, item) => item !== index),
                )
              }}
            >
              Убрать
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn"
        onClick={() => onChange([...minutes, minutes.length === 0 ? '10' : ''], [...seconds, '0'])}
      >
        Добавить таймер
      </button>
    </fieldset>
  )
}
