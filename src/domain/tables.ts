import type { HallTable } from '../types'

export function tableNumber(label: string): number {
  const match = /(\d+)\s*$/.exec(label.trim())
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

export function tableOption(label: string): string {
  const match = /(\d+)\s*$/.exec(label.trim())
  return match ? match[1] : label
}

export function sortedTables(tables: HallTable[]): HallTable[] {
  return [...tables].sort((a, b) => tableNumber(a.label) - tableNumber(b.label) || a.label.localeCompare(b.label, 'ru'))
}

export function removeLastTable(tables: HallTable[]): HallTable[] {
  if (tables.length === 0) return tables
  const last = sortedTables(tables)[sortedTables(tables).length - 1]
  return tables.filter((table) => table.id !== last.id)
}
