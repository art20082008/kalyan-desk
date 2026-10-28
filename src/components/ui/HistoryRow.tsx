import type { ReactNode } from 'react'
import { Icon } from './Icon'

export function HistoryRow({
  date,
  count,
  open,
  onToggle,
  children,
}: {
  date: string
  count: string
  open: boolean
  onToggle: () => void
  children?: ReactNode
}) {
  return (
    <article className="history-row">
      <button type="button" className={open ? 'history-main open' : 'history-main'} aria-expanded={open} onClick={onToggle}>
        <strong>{date}</strong>
        <span>{count}</span>
        <Icon name="chevron" />
      </button>
      {open ? <div className="history-body">{children}</div> : null}
    </article>
  )
}
