import type { HallTable, Hookah } from '../../types'
import { timerFace } from '../../domain/timers'
import { TableTile } from '../ui/TableTile'

export function Hall({
  tables,
  hookahs,
  now,
  onAddTable,
  onRemoveTable,
  onPick,
}: {
  tables: HallTable[]
  hookahs: Hookah[]
  now: number
  onAddTable: () => void
  onRemoveTable: () => void
  onPick: (label: string) => void
}) {
  return (
    <section className="hall">
      <header className="hall-head">
        <h2>Зал</h2>
        <div className="table-counter">
          <button type="button" aria-label="Убрать стол" onClick={onRemoveTable} disabled={tables.length === 0}>
            −
          </button>
          <span>{tables.length}</span>
          <button type="button" aria-label="Добавить стол" onClick={onAddTable}>
            +
          </button>
        </div>
      </header>
      <div className="hall-grid">
        {tables.map((table) => {
          const seated = hookahs.filter((hookah) => hookah.table === table.label && hookah.finishedAt == null)
          const lines = seated.map((hookah) => `${hookah.flavorName || 'Кальян'} · ${timerFace(hookah, now).clock}`)
          return <TableTile key={table.id} label={table.label} lines={lines} onClick={() => onPick(table.label)} />
        })}
      </div>
    </section>
  )
}
