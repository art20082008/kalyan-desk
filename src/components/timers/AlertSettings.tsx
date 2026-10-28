export function AlertSettings({
  minutes,
  onChange,
}: {
  minutes: string[]
  onChange: (minutes: string[]) => void
}) {
  return (
    <fieldset className="alerts">
      <legend>Алерты</legend>
      <p className="muted">Интервалы по очереди. Следующий отсчитывается от нажатия «Продолжить», а не от срабатывания.</p>
      {minutes.length === 0 ? <p className="muted">Пока нет предупреждений.</p> : null}
      <ul className="alert-list">
        {minutes.map((minute, index) => (
          <li key={index}>
            <label>
              Минута
              <input
                className="field"
                inputMode="numeric"
                value={minute}
                onChange={(event) => {
                  const next = [...minutes]
                  next[index] = event.target.value
                  onChange(next)
                }}
              />
            </label>
            <button
              type="button"
              className="btn ghost"
              onClick={() => onChange(minutes.filter((_, item) => item !== index))}
            >
              Убрать
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn"
        onClick={() => onChange([...minutes, minutes.length === 0 ? '25' : ''])}
      >
        Добавить алерт
      </button>
    </fieldset>
  )
}
