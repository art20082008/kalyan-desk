import type { Flavor } from '../../types'
import { Button } from '../ui/Button'

export function FlavorList({
  flavors,
  copied,
  onDrop,
  onExcel,
  onCopy,
}: {
  flavors: Flavor[]
  copied: boolean
  onDrop: (id: string) => void
  onExcel: () => void
  onCopy: () => void
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
      <div className="order-text">
        {flavors.length === 0 ? <p className="muted">Закончившиеся вкусы появятся здесь текстом.</p> : null}
        {brands.map((brand) => (
          <div key={brand}>
            <p>{brand}</p>
            {flavors
              .filter((flavor) => flavor.brand === brand)
              .map((flavor) => (
                <p key={flavor.id} className="request-line">
                  — {flavor.name}
                </p>
              ))}
          </div>
        ))}
      </div>
      <div className="request-actions">
        <Button variant="small" onClick={onExcel} disabled={flavors.length === 0}>
          Выгрузить в Excel
        </Button>
        <Button variant="small" onClick={onCopy} disabled={flavors.length === 0}>
          {copied ? 'Скопировано' : 'Скопировать текст'}
        </Button>
      </div>
    </section>
  )
}
