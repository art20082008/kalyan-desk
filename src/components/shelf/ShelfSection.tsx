import { useState } from 'react'
import { MAX_SKU } from '../../types'
import { plural } from '../../domain/format'
import { useShelf } from '../../store/shelfStore'
import { BrandChips } from './BrandChips'
import { FlavorList } from './FlavorList'
import { RequestExport } from './RequestExport'
import { ShelfVisual } from './ShelfVisual'
import { StopList } from './StopList'

export function ShelfSection() {
  const shelf = useShelf()
  const [brand, setBrand] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newName, setNewName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const filtered = shelf.flavors.filter((flavor) => {
    if (brand && flavor.brand !== brand) return false
    if (!query.trim()) return true
    const haystack = `${flavor.brand} ${flavor.name}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const brands = [...new Set(shelf.flavors.map((flavor) => flavor.brand))].sort((a, b) => a.localeCompare(b, 'ru'))

  return (
    <div className="section">
      <div className="section-head">
        <div>
          <h2>Кальянная полка</h2>
          <p className="muted">
            {shelf.flavors.length} {plural(shelf.flavors.length, 'вкус', 'вкуса', 'вкусов')} из {MAX_SKU}. Клик и
            перетаскивание двигают карточку между колонками.
          </p>
        </div>
      </div>
      <form
        className="add-form"
        onSubmit={(event) => {
          event.preventDefault()
          const error = shelf.add(newBrand, newName)
          setFormError(error)
          if (!error) {
            setNewName('')
          }
        }}
      >
        <input
          className="field"
          list="brands"
          placeholder="Бренд"
          value={newBrand}
          onChange={(event) => setNewBrand(event.target.value)}
        />
        <datalist id="brands">
          {brands.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <input className="field" placeholder="Вкус" value={newName} onChange={(event) => setNewName(event.target.value)} />
        <button type="submit" className="btn primary">
          Добавить вкус
        </button>
        {shelf.flavors.length === 0 ? (
          <button type="button" className="btn" onClick={shelf.loadStarter}>
            Пример полки
          </button>
        ) : null}
      </form>
      {formError ? <p className="form-error">{formError}</p> : null}
      <div className="shelf-tools">
        <BrandChips flavors={shelf.flavors} active={brand} onChange={setBrand} />
        <input
          className="field search"
          placeholder="Найти вкус"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="board">
        <ShelfVisual
          flavors={filtered.filter((flavor) => flavor.status === 'shelf')}
          onMove={shelf.move}
          onRemove={shelf.remove}
          onDrop={(id) => shelf.move(id, 'shelf')}
        />
        <StopList
          flavors={filtered.filter((flavor) => flavor.status === 'stop')}
          onMove={shelf.move}
          onDrop={(id) => shelf.move(id, 'stop')}
        />
        <FlavorList
          flavors={filtered.filter((flavor) => flavor.status === 'request')}
          onMove={shelf.move}
          onDrop={(id) => shelf.move(id, 'request')}
        />
      </div>
      <RequestExport
        count={shelf.requestLines.length}
        onExcel={() => {
          void shelf.exportExcel()
        }}
        onCopy={() => {
          void shelf.copyText()
        }}
      />
      {shelf.undo ? (
        <div className="undo">
          <span>Вкус перенесён</span>
          <button type="button" className="btn" onClick={shelf.undoLast}>
            Отменить
          </button>
        </div>
      ) : null}
    </div>
  )
}
