import type { ButtonHTMLAttributes } from 'react'
import { Icon } from './Icon'

type IconName = 'pause' | 'play' | 'trash' | 'pencil'

export function IconButton({
  name,
  label,
  danger = false,
  ...props
}: {
  name: IconName
  label: string
  danger?: boolean
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={danger ? 'icon-btn danger' : 'icon-btn'} aria-label={label} {...props}>
      <Icon name={name} />
      <span className="tip" role="tooltip">
        {label}
      </span>
    </button>
  )
}
