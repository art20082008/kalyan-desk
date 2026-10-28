import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Modal({
  title,
  heading,
  onClose,
  children,
  narrow = false,
  footer,
}: {
  title: string
  heading?: ReactNode
  onClose: () => void
  children: ReactNode
  narrow?: boolean
  footer?: ReactNode
}) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={narrow ? 'modal narrow' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          {heading ?? <h2>{title}</h2>}
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            <Icon name="x" />
          </button>
        </header>
        {children}
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
