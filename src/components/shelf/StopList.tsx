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
        <span>{flavors.length}</span>
      </header>
      {flavors.length === 0 ? <p className="muted">Стоп-лист пуст. Перетащите вкус сюда или нажмите «Закончился».</p> : null}
      {flavors.map((flavor) => (
        <FlavorCard key={flavor.id} flavor={flavor} onMove={onMove} />
      ))}
    </section>
  )
}
