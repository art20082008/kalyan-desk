import type { BrandRank, FlavorRank, SmokingAverage } from '../../domain/analytics'
import type { Flavor } from '../../types'
import { plural } from '../../domain/format'

export function Analytics({
  top,
  brands,
  ended,
  smoking,
  onExport,
}: {
  top: FlavorRank[]
  brands: BrandRank[]
  ended: Flavor[]
  smoking: SmokingAverage
  onExport: () => void
}) {
  return (
    <section className="analytics">
      <header className="section-head">
        <h3>Мини-аналитика</h3>
        <button type="button" className="btn primary" onClick={onExport}>
          Выгрузить аналитику в Excel
        </button>
      </header>
      <div className="stat-grid">
        <article className="stat">
          <p className="eyebrow">Среднее курение</p>
          <strong>{smoking.averageMin == null ? '—' : `${smoking.averageMin} мин`}</strong>
          <span className="muted">{smoking.count} {plural(smoking.count, 'сессия', 'сессии', 'сессий')} по факту</span>
        </article>
        <article className="stat">
          <p className="eyebrow">Сейчас закончились</p>
          <strong>{ended.length}</strong>
          <span className="muted">в стоп-листе и заявке</span>
        </article>
      </div>
      {smoking.byKind.length > 0 ? (
        <ul className="kind-list">
          {smoking.byKind.map((row) => (
            <li key={row.kind}>
              <span>{row.kind}</span>
              <strong>{row.averageMin} мин</strong>
            </li>
          ))}
        </ul>
      ) : null}
      <h4>Топ вкусов</h4>
      {top.length === 0 ? <p className="muted">Пока не из чего считать: заявок не было.</p> : null}
      <ol className="rank">
        {top.slice(0, 8).map((row) => (
          <li key={`${row.brand}-${row.name}`}>
            <span>
              {row.name}
              <small>{row.brand}</small>
            </span>
            <strong>{row.count}</strong>
          </li>
        ))}
      </ol>
      <h4>Бренды</h4>
      {brands.length === 0 ? <p className="muted">Разбивка появится после первой заявки.</p> : null}
      <ul className="rank">
        {brands.map((row) => (
          <li key={row.brand}>
            <span>{row.brand}</span>
            <strong>{row.count}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
