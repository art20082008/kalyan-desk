export function TagChip({ label, tone = 'brand' }: { label: string; tone?: 'brand' | 'citrus' }) {
  return <span className={tone === 'citrus' ? 'tag citrus' : 'tag'}>{label}</span>
}
