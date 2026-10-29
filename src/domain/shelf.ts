import type { AppData, Flavor, FlavorStatus, OrderRequest, UndoMove } from '../types'
import { MAX_SKU } from '../types'

const FORWARD: Record<FlavorStatus, FlavorStatus> = {
  shelf: 'stop',
  stop: 'request',
  request: 'stop',
}

export function endedFlavors(flavors: Flavor[]): Flavor[] {
  return flavors.filter((flavor) => flavor.status === 'stop' || flavor.status === 'request')
}

/** Текст заявки: вкусы из «закончились» и те, что уже перенесены в заявку. */
export function orderFlavors(flavors: Flavor[]): Flavor[] {
  return endedFlavors(flavors)
}

export function moveFlavor(
  flavors: Flavor[],
  id: string,
  to: FlavorStatus,
  now: number,
): { flavors: Flavor[]; undo: UndoMove | null } {
  const current = flavors.find((flavor) => flavor.id === id)
  if (!current || current.status === to) return { flavors, undo: null }
  return {
    flavors: flavors.map((flavor) => (flavor.id === id ? { ...flavor, status: to } : flavor)),
    undo: { flavorId: id, from: current.status, at: now },
  }
}

export function forwardFlavor(
  flavors: Flavor[],
  id: string,
  now: number,
): { flavors: Flavor[]; undo: UndoMove | null } {
  const current = flavors.find((flavor) => flavor.id === id)
  if (!current) return { flavors, undo: null }
  return moveFlavor(flavors, id, FORWARD[current.status], now)
}

export function undoMove(flavors: Flavor[], undo: UndoMove | null): Flavor[] {
  if (!undo) return flavors
  return flavors.map((flavor) => (flavor.id === undo.flavorId ? { ...flavor, status: undo.from } : flavor))
}

export function addFlavor(
  flavors: Flavor[],
  brand: string,
  name: string,
): { flavors: Flavor[]; error: string | null } {
  const cleanBrand = brand.trim()
  const cleanName = name.trim()
  if (!cleanBrand || !cleanName) return { flavors, error: 'Укажите бренд и вкус' }
  if (flavors.length >= MAX_SKU) return { flavors, error: `Лимит ${MAX_SKU} вкусов` }
  const duplicate = flavors.some(
    (flavor) =>
      flavor.brand.toLowerCase() === cleanBrand.toLowerCase() &&
      flavor.name.toLowerCase() === cleanName.toLowerCase(),
  )
  if (duplicate) return { flavors, error: 'Такой вкус уже есть' }
  return {
    flavors: [
      ...flavors,
      { id: crypto.randomUUID(), brand: cleanBrand, name: cleanName, status: 'shelf' },
    ],
    error: null,
  }
}

export function removeFlavor(flavors: Flavor[], id: string): Flavor[] {
  return flavors.filter((flavor) => flavor.id !== id)
}

export function recordRequest(data: AppData, now: number): { data: AppData; created: boolean } {
  const lines = orderFlavors(data.flavors).map((flavor) => ({ id: flavor.id, brand: flavor.brand, name: flavor.name }))
  if (lines.length === 0) return { data, created: false }
  const signature = lines.map((line) => line.id).join('|')
  const latest = data.requests[0]
  if (
    latest &&
    now - latest.createdAt < 60_000 &&
    latest.flavors.map((line) => line.id).join('|') === signature
  ) {
    return { data, created: false }
  }
  const request: OrderRequest = { id: crypto.randomUUID(), createdAt: now, flavors: lines }
  return { data: { ...data, requests: [request, ...data.requests] }, created: true }
}

export function brandCounts(flavors: Flavor[]): { brand: string; ended: number; total: number }[] {
  const map = new Map<string, { ended: number; total: number }>()
  for (const flavor of flavors) {
    const row = map.get(flavor.brand) ?? { ended: 0, total: 0 }
    row.total += 1
    if (flavor.status !== 'shelf') row.ended += 1
    map.set(flavor.brand, row)
  }
  return [...map.entries()]
    .map(([brand, row]) => ({ brand, ...row }))
    .sort((a, b) => b.ended - a.ended || a.brand.localeCompare(b.brand, 'ru'))
}
