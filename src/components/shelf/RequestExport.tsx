export function RequestExport({
  count,
  onExcel,
  onCopy,
}: {
  count: number
  onExcel: () => void
  onCopy: () => void
}) {
  return (
    <div className="export-bar">
      <p>
        {count > 0 ? `В заявке ${count}` : 'Заявка пустая'}
        <span className="muted"> · Ctrl+S Excel · Ctrl+C текст</span>
      </p>
      <div className="row">
        <button type="button" className="btn primary" onClick={onExcel} disabled={count === 0}>
          Выгрузить в Excel
        </button>
        <button type="button" className="btn" onClick={onCopy} disabled={count === 0}>
          Скопировать текст
        </button>
      </div>
    </div>
  )
}
