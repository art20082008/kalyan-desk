export function NumberInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const filled = value.trim().length > 0
  return (
    <label className={filled ? 'number-input filled' : 'number-input'}>
      <input
        inputMode="numeric"
        value={value}
        placeholder="своё"
        aria-label="Своё значение в минутах"
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 3))}
      />
      <em>мин</em>
    </label>
  )
}
