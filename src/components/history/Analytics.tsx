import type { BrandRank, FlavorRank, SmokingAverage } from '../../domain/analytics'
import { plural } from '../../domain/format'
import type { Flavor, Hookah } from '../../types'
import { timerSnapshot } from '../../domain/timers'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

export function Analytics({
  top,
  brands,
  ended,
  smoking,
  live,
  now,
  onExport,
}: {
  top: FlavorRank[]
  brands: BrandRank[]
  ended: Flavor[]
  smoking: SmokingAverage
  live: Hookah[]
  now: number
  onExport: () => void
}) {
  const active = live.find((hookah) => hookah.finishedAt == null && hookah.running)
  const liveMin = active ? Math.max(0, Math.round(timerSnapshot(active, now).smokingMs / 60_000)) : null
  const value = smoking.averageMin != null ? `${smoking.averageMin} мин` : liveMin != null ? `${liveMin} мин` : '—'
  const caption =
    smoking.averageMin != null
      ? `Среднее по ${smoking.count} ${plural(smoking.count, 'сессии', 'сессиям', 'сессиям')}`
      : active
        ? `Идёт сейчас (${active.table}). Среднее появится после первой завершённой сессии`
        : 'Среднее появится после первой завершённой сессии'

  return (
    <section className="analytics">
      <header>
        <h3>Аналитика</h3>
        <Button variant="small" onClick={onExport}>
          Выгрузить в Excel
        </Button>
      </header>
      <div className="kpi-grid">
        <article className="kpi">
          <div className="value">
            <Icon name="activity" />
            <span>{value}</span>
          </div>
          <p>{caption}</p>
        </article>
        <article className="kpi">
          <div className="value">
            <Icon name="tag" />
            <span>{ended.length}</span>
          </div>
          <p>
            {ended.length === 1 ? 'Закончился вкус' : 'Закончились вкусы'}
            <br />· в стоп-листе и в заявке
          </p>
        </article>
      </div>
      <div className="rank-block">
        <h4>Топ вкусов</h4>
        {top.length === 0 ? <p className="muted">Пока не из чего считать: заявок не было.</p> : null}
        {top.slice(0, 8).map((row) => (
          <div className="rank-row" key={`${row.brand}-${row.name}`}>
            <div>
              <strong>{row.name}</strong>
              <small>{row.brand}</small>
            </div>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
      <div className="rank-block">
        <h4>Бренды</h4>
        {brands.length === 0 ? <p className="muted">Разбивка появится после первой заявки.</p> : null}
        {brands.map((row) => (
          <div className="rank-row" key={row.brand}>
            <div>
              <strong>{row.brand}</strong>
              <em>
                {row.count} {plural(row.count, 'вкус', 'вкуса', 'вкусов')} в заявках
              </em>
            </div>
            <strong>{row.count}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
