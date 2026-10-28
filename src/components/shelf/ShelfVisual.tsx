import type { Flavor, FlavorStatus } from '../../types'
import { FlavorCard } from './FlavorCard'

export function ShelfVisual({
  flavors,
  onMove,
  onRemove,
  onDrop,
}: {
  flavors: Flavor[]
  onMove: (id: string, to: FlavorStatus) => void
  onRemove: (id: string) => void
  onDrop: (id: string) => void
}) {
  const brands = [...new Set(flavors.map((flavor) => flavor.brand))]
  return (
    <section
      className="column shelf-visual"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const id = event.dataTransfer.getData('text/plain')
        if (id) onDrop(id)
      }}
    >
      <header>
        <h3>На полке</h3>
        <span className="pill">{flavors.length}</span>
      </header>
      {flavors.length === 0 ? <p className="muted">Полка пуста. Добавьте вкус или верните его из стоп-листа.</p> : null}
      {brands.map((brand) => (
        <div key={brand} className="plank">
          <p className="eyebrow">{brand}</p>
          {flavors
            .filter((flavor) => flavor.brand === brand)
            .map((flavor) => (
              <FlavorCard key={flavor.id} flavor={flavor} onMove={onMove} onRemove={onRemove} />
            ))}
        </div>
      ))}
    </section>
  )
}
