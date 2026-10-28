import { useRef } from 'react'
import type { Flavor, FlavorStatus } from '../../types'

const NEXT: Record<FlavorStatus, FlavorStatus> = {
  shelf: 'stop',
  stop: 'request',
  request: 'stop',
}

const BACK: Record<FlavorStatus, FlavorStatus> = {
  shelf: 'shelf',
  stop: 'shelf',
  request: 'stop',
}

const FORWARD_LABEL: Record<FlavorStatus, string> = {
  shelf: 'Закончился',
  stop: 'В заявку',
  request: 'В стоп',
}

export function FlavorCard({
  flavor,
  onMove,
  onRemove,
}: {
  flavor: Flavor
  onMove: (id: string, to: FlavorStatus) => void
  onRemove?: (id: string) => void
}) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  return (
    <article
      className="flavor"
      draggable
      data-noswipe
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', flavor.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      onPointerDown={(event) => {
        start.current = { x: event.clientX, y: event.clientY }
      }}
      onPointerUp={(event) => {
        if (!start.current) return
        const dx = event.clientX - start.current.x
        const dy = event.clientY - start.current.y
        start.current = null
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.3) return
        swiped.current = true
        onMove(flavor.id, dx < 0 ? NEXT[flavor.status] : BACK[flavor.status])
      }}
    >
      <button
        type="button"
        className="flavor-main"
        onClick={() => {
          if (swiped.current) {
            swiped.current = false
            return
          }
          onMove(flavor.id, NEXT[flavor.status])
        }}
      >
        <strong>{flavor.name}</strong>
        <span>{flavor.brand}</span>
      </button>
      <div className="row">
        {flavor.status !== 'shelf' ? (
          <button type="button" className="btn ghost" onClick={() => onMove(flavor.id, BACK[flavor.status])}>
            Назад
          </button>
        ) : null}
        <button type="button" className="btn ghost" onClick={() => onMove(flavor.id, NEXT[flavor.status])}>
          {FORWARD_LABEL[flavor.status]}
        </button>
        {onRemove ? (
          <button type="button" className="btn ghost" onClick={() => onRemove(flavor.id)}>
            Удалить
          </button>
        ) : null}
      </div>
    </article>
  )
}
