export function RadioOption({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" className={selected ? 'radio selected' : 'radio'} role="radio" aria-checked={selected} onClick={onSelect}>
      <i />
      {label}
    </button>
  )
}
