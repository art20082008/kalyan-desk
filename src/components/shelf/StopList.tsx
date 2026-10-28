import type { Flavor, FlavorStatus } from '../../types'
import { FlavorCard } from './FlavorCard'

export function StopList({
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
        <h3>Закончились</h3>
        <span className="pill">{flavors.length}</span>
      </header>
      {flavors.length === 0 ? (
        <div className="empty compact">
          <h3>Стоп-лист пуст</h3>
          <p>Перетащите вкус сюда или нажмите «Закончился».</p>
        </div>
      ) : (
        flavors.map((flavor) => <FlavorCard key={flavor.id} flavor={flavor} onMove={onMove} />)
      )}
    </section>
  )
}
