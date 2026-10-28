import type { Flavor, FlavorStatus } from '../../types'
import { FlavorCard } from './FlavorCard'

export function FlavorList({
  flavors,
  onMove,
  onDrop,
}: {
  flavors: Flavor[]
  onMove: (id: string, to: FlavorStatus) => void
  onDrop: (id: string) => void
}) {
  return (
    <section
      className="column"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/plain')
        if (id) onDrop(id)
      }}
    >
      <header>
        <h3>В заявке</h3>
        <span className="pill">{flavors.length}</span>
      </header>
      {flavors.length === 0 ? (
        <p className="muted">Сюда попадают вкусы, которые нужно заказать. Клик или перетаскивание, как в Trello.</p>
      ) : (
        flavors.map((flavor) => <FlavorCard key={flavor.id} flavor={flavor} onMove={onMove} />)
      )}
    </section>
  )
}
