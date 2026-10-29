import type { Flavor, FlavorStatus } from '../../types'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

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
    <article className="shelf-card" data-noswipe>
      <button
        type="button"
        className="drag-handle"
        draggable
        aria-label="Перетащить"
        data-noswipe
        onDragStart={(event) => {
          event.dataTransfer.setData('text/plain', flavor.id)
          event.dataTransfer.effectAllowed = 'move'
        }}
      >
        <Icon name="grip" />
      </button>
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
          <button type="button" className="icon-btn compact danger" aria-label="Удалить" onClick={() => onRemove(flavor.id)}>
            <Icon name="trash" />
          </button>
        ) : null}
      </div>
    </article>
  )
}
