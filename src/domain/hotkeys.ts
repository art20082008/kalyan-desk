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

export type HotkeyAction = 'ack' | 'prev' | 'next'

/** Пробел гасит самый ранний алерт, стрелки переключают разделы. В поле ввода оба молчат. */
export function hotkeyAction(event: HotkeyInput): HotkeyAction | null {
  if (isTextEntry(event.target)) return null
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  if (event.key === 'ArrowLeft') return 'prev'
  if (event.key === 'ArrowRight') return 'next'
  if (event.key === ' ') {
    if (isButtonTarget(event.target)) return null
    return 'ack'
  }
  return null
}
