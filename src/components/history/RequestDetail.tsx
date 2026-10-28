import type { OrderRequest } from '../../types'

export function RequestDetail({ request }: { request: OrderRequest }) {
  const groups = new Map<string, string[]>()
  for (const line of request.flavors) {
    const names = groups.get(line.brand) ?? []
    names.push(line.name)
    groups.set(line.brand, names)
  }
  return (
    <>
      {[...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
        .map(([brand, names]) => (
          <div key={brand} className="request-line">
            <p>{brand}</p>
            {names.sort((a, b) => a.localeCompare(b, 'ru')).map((name) => (
              <strong key={name}>{name}</strong>
            ))}
          </div>
        ))}
    </>
  )
}
