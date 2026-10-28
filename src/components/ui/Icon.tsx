type IconName = 'pause' | 'play' | 'trash' | 'pencil' | 'x' | 'search' | 'chevron' | 'check' | 'activity' | 'tag'

export function Icon({ name }: { name: IconName }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (name === 'pause') {
    return (
      <svg {...common}>
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    )
  }
  if (name === 'play') {
    return (
      <svg {...common}>
        <polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (name === 'trash') {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    )
  }
  if (name === 'pencil') {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    )
  }
  if (name === 'x') {
    return (
      <svg {...common}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    )
  }
  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    )
  }
  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    )
  }
  if (name === 'check') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </svg>
    )
  }
  if (name === 'activity') {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 8-6-16-3 8H2" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M12 2 8 8H3l4 4-2 8 7-4 7 4-2-8 4-4h-5Z" />
    </svg>
  )
}
