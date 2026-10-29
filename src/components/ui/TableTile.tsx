export function TableTile({
  label,
  lines,
  onClick,
}: {
  label: string
  lines: string[]
  onClick: () => void
}) {
  const busy = lines.length > 0
  return (
    <button type="button" className={busy ? 'table-tile busy' : 'table-tile'} onClick={onClick}>
      <strong>{label}</strong>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </button>
  )
}
