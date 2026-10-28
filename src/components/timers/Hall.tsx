import type { HallTable, Hookah } from '../../types'
import { timerFace } from '../../domain/timers'
import { Button } from '../ui/Button'
import { TableTile } from '../ui/TableTile'

export function Hall({
  tables,
  hookahs,
  now,
  onAddTable,
  onPick,
}: {
  tables: HallTable[]
  hookahs: Hookah[]
  now: number
  onAddTable: () => void
  onPick: (label: string) => void
}) {
  return (
    <section className="hall">
      <header className="hall-head">
        <h2>Зал</h2>
        <Button variant="small" onClick={onAddTable}>
          + Добавить стол
        </Button>
      </header>
      <div className="hall-grid">
        {tables.map((table) => {
          const seated = hookahs.filter((hookah) => hookah.table === table.label && hookah.finishedAt == null)
          const lines = seated.map((hookah) => `${hookah.kind} · ${timerFace(hookah, now).clock}`)
          return <TableTile key={table.id} label={table.label} lines={lines} onClick={() => onPick(table.label)} />
        })}
      </div>
    </section>
  )
}
