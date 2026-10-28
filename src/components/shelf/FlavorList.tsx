import type { Flavor } from '../../types'
import { Button } from '../ui/Button'

export function FlavorList({
  flavors,
  copied,
  onDrop,
  onExport,
}: {
  flavors: Flavor[]
  copied: boolean
  onDrop: (id: string) => void
  onExport: () => void
}) {
  const brands = [...new Set(flavors.map((flavor) => flavor.brand))].sort((a, b) => a.localeCompare(b, 'ru'))
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
        <span>{flavors.length}</span>
      </header>
      <div>
        {brands.map((brand) => (
          <div key={brand}>
            <p className="muted">{brand}</p>
            {flavors
              .filter((flavor) => flavor.brand === brand)
              .map((flavor) => (
                <div
                  key={flavor.id}
                  className="request-line"
                  draggable
                  data-noswipe
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', flavor.id)
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                >
                  <strong>{flavor.name}</strong>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className="request-actions">
        <Button variant="small" onClick={onExport} disabled={flavors.length === 0}>
          {copied ? 'Скопировано' : 'Выгрузить'}
        </Button>
      </div>
    </section>
  )
}
