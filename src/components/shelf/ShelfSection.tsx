import { useState } from 'react'
import { MAX_SKU } from '../../types'
import { plural } from '../../domain/format'
import { useShelf } from '../../store/shelfStore'
import { BrandChips } from './BrandChips'
import { FlavorList } from './FlavorList'
import { ShelfVisual } from './ShelfVisual'
import { StopList } from './StopList'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { TextField } from '../ui/TextField'

export function ShelfSection() {
  const shelf = useShelf()
  const [brand, setBrand] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newName, setNewName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = shelf.flavors.filter((flavor) => {
    if (brand && flavor.brand !== brand) return false
    if (!query.trim()) return true
    const haystack = `${flavor.brand} ${flavor.name}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const brands = [...new Set(shelf.flavors.map((flavor) => flavor.brand))].sort((a, b) => a.localeCompare(b, 'ru'))
  const total = shelf.flavors.length

  return (
    <div className="page">
      <div>
        <h2 className="page-title">Кальянная полка</h2>
        <p className="page-lead">
          На полке {total} {plural(total, 'вкус', 'вкуса', 'вкусов')} из {MAX_SKU} в базе. Карточку можно перетащить в
          другую колонку или перенести кнопкой.
        </p>
      </div>
      <form
        className="shelf-add"
        onSubmit={(event) => {
          event.preventDefault()
          const error = shelf.add(newBrand, newName)
          setFormError(error)
          if (!error) setNewName('')
        }}
      >
        <TextField
          label="Бренд"
          list="brands"
          placeholder="Например, Darkside"
          value={newBrand}
          onChange={(event) => setNewBrand(event.target.value)}
        />
        <datalist id="brands">
          {brands.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <TextField label="Вкус" placeholder="Например, Supernova" value={newName} onChange={(event) => setNewName(event.target.value)} />
        <Button variant="brand" type="submit">
          Добавить вкус
        </Button>
        {shelf.flavors.length === 0 ? (
          <Button variant="small" onClick={shelf.loadStarter}>
            Пример полки
          </Button>
        ) : null}
      </form>
      {formError ? <p className="form-error">{formError}</p> : null}
      <div className="shelf-tools">
        <BrandChips flavors={shelf.flavors} active={brand} onChange={setBrand} />
        <label className="search">
          <Icon name="search" />
          <input
            placeholder="Найти вкус или бренд"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
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
          copied={copied}
          onDrop={(id) => shelf.move(id, 'request')}
          onExport={() => {
            void shelf.copyText().then((ok) => {
              if (!ok) return
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1600)
            })
          }}
        />
      </div>
      {shelf.undo ? (
        <div className="undo">
          <span>Вкус перенесён</span>
          <Button onClick={shelf.undoLast}>Отменить</Button>
        </div>
      ) : null}
    </div>
  )
}
