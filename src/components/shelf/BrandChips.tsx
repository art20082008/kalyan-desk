import { brandCounts } from '../../domain/shelf'
import type { Flavor } from '../../types'

export function BrandChips({
  flavors,
  active,
  onChange,
}: {
  flavors: Flavor[]
  active: string | null
  onChange: (brand: string | null) => void
}) {
  const brands = brandCounts(flavors)
  return (
    <div className="chips" role="tablist" aria-label="Бренды">
      <button type="button" className={active == null ? 'chip active' : 'chip'} onClick={() => onChange(null)}>
        Все
        <span>{flavors.filter((flavor) => flavor.status !== 'shelf').length}</span>
      </button>
      {brands.map((brand) => (
        <button
          key={brand.brand}
          type="button"
          className={active === brand.brand ? 'chip active' : 'chip'}
          onClick={() => onChange(active === brand.brand ? null : brand.brand)}
        >
          {brand.brand}
          <span>{brand.ended}</span>
        </button>
      ))}
    </div>
  )
}
