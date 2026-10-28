import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'small' | 'brand' | 'danger' | 'ghost'

export function Button({
  variant = 'secondary',
  children,
  ...props
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const kind = variant === 'secondary' ? 'btn' : `btn ${variant}`
  return (
    <button type="button" className={kind} {...props}>
      {children}
    </button>
  )
}
