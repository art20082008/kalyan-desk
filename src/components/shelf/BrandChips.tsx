import { brandCounts } from '../../domain/shelf'
import type { Flavor } from '../../types'
import { ChoiceChip } from '../ui/ChoiceChip'

export function BrandChips({
  flavors,
  active,
  onChange,
}: {
  flavors: Flavor[]
  active: string | null
  onChange: (brand: string | null) => void
}) {
  const brands = [...brandCounts(flavors)].sort((a, b) => b.total - a.total || a.brand.localeCompare(b.brand, 'ru'))
  return (
    <div className="chips" role="tablist" aria-label="Бренды">
      <ChoiceChip selected={active == null} count={flavors.length} onClick={() => onChange(null)}>
        Все
      </ChoiceChip>
      {brands.map((brand) => (
        <ChoiceChip
          key={brand.brand}
          selected={active === brand.brand}
          count={brand.total}
          onClick={() => onChange(active === brand.brand ? null : brand.brand)}
        >
          {brand.brand}
        </ChoiceChip>
      ))}
    </div>
  )
}
