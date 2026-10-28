export function isTextEntry(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as { tagName?: string; isContentEditable?: boolean }
  const tag = el.tagName?.toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return Boolean(el.isContentEditable)
}

export function isButtonTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') return false
  const el = target as { tagName?: string; closest?: (selector: string) => unknown }
  if (el.tagName?.toUpperCase() === 'BUTTON') return true
  if (typeof el.closest === 'function' && el.closest('button, a, [role="button"]')) return true
  return false
}

export interface HotkeyInput {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  target: unknown
}

export type HotkeyAction = 'ack' | 'excel' | 'copy' | 'close' | 'prev' | 'next'

/** Пробел и Ctrl+C не перехватываются в полях ввода. */
export function hotkeyAction(event: HotkeyInput): HotkeyAction | null {
  const typing = isTextEntry(event.target)
  if (event.key === 'Escape') return 'close'
  if (event.key === 'ArrowLeft' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) return 'prev'
  if (event.key === 'ArrowRight' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) return 'next'
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') return 'excel'
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
    if (typing) return null
    return 'copy'
  }
  if (event.key === ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (typing || isButtonTarget(event.target)) return null
    return 'ack'
  }
  return null
}
