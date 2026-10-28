import { useEffect, type ReactNode } from 'react'

export function Modal({
  title,
  onClose,
  children,
  narrow = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  narrow?: boolean
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
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
