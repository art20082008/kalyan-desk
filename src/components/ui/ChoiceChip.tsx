import type { ReactNode } from 'react'

export function ChoiceChip({
  selected,
  children,
  count,
  onClick,
}: {
  selected: boolean
  children: ReactNode
  count?: number
  onClick: () => void
}) {
  return (
    <button type="button" className={selected ? 'choice selected' : 'choice'} aria-pressed={selected} onClick={onClick}>
      {children}
      {count != null ? <span className="count">{count}</span> : null}
    </button>
  )
}
