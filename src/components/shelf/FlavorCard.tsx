import type { Flavor, FlavorStatus } from '../../types'
import { Button } from '../ui/Button'

export function FlavorCard({
  flavor,
  onMove,
  onRemove,
}: {
  flavor: Flavor
  onMove: (id: string, to: FlavorStatus) => void
  onRemove?: (id: string) => void
}) {
  return (
    <article
      className="shelf-card"
      draggable
      data-noswipe
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', flavor.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className="text">
        <strong>{flavor.name}</strong>
        <em>{flavor.brand}</em>
      </div>
      <div className="actions">
        {flavor.status === 'shelf' ? (
          <Button variant="small" onClick={() => onMove(flavor.id, 'stop')}>
            Закончился
          </Button>
        ) : null}
        {flavor.status === 'stop' ? (
          <Button variant="small" onClick={() => onMove(flavor.id, 'shelf')}>
            На полку
          </Button>
        ) : null}
        {onRemove ? (
          <Button variant="small" onClick={() => onRemove(flavor.id)}>
            Удалить
          </Button>
        ) : null}
      </div>
    </article>
  )
}
