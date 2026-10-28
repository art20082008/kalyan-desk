import type { Flavor, OrderRequest, SmokingSession } from '../types'
import { round1 } from './format'

export interface FlavorRank {
  brand: string
  name: string
  count: number
}

export interface BrandRank {
  brand: string
  count: number
}

export interface KindAverage {
  kind: string
  averageMin: number
  count: number
}

export interface SmokingAverage {
  averageMin: number | null
  count: number
  byKind: KindAverage[]
}

export function topFlavors(requests: OrderRequest[]): FlavorRank[] {
  const map = new Map<string, FlavorRank>()
  for (const request of requests) {
    for (const line of request.flavors) {
      const key = `${line.brand}\u0000${line.name}`
      const row = map.get(key) ?? { brand: line.brand, name: line.name, count: 0 }
      row.count += 1
      map.set(key, row)
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, 'ru'))
}

export function brandBreakdown(requests: OrderRequest[]): BrandRank[] {
  const map = new Map<string, number>()
  for (const request of requests) {
    for (const line of request.flavors) {
      map.set(line.brand, (map.get(line.brand) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([brand, count]) => ({ brand, count }))
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand, 'ru'))
}

export function currentEnded(flavors: Flavor[]): Flavor[] {
  return flavors
    .filter((flavor) => flavor.status !== 'shelf')
    .sort((a, b) => a.brand.localeCompare(b.brand, 'ru') || a.name.localeCompare(b.name, 'ru'))
}

export function smokingAverage(sessions: SmokingSession[]): SmokingAverage {
  if (sessions.length === 0) return { averageMin: null, count: 0, byKind: [] }
  const total = sessions.reduce((sum, session) => sum + session.actualMin, 0)
  const kinds = new Map<string, { total: number; count: number }>()
  for (const session of sessions) {
    const row = kinds.get(session.kind) ?? { total: 0, count: 0 }
    row.total += session.actualMin
    row.count += 1
    kinds.set(session.kind, row)
  }
  return {
    averageMin: round1(total / sessions.length),
    count: sessions.length,
    byKind: [...kinds.entries()]
      .map(([kind, row]) => ({ kind, averageMin: round1(row.total / row.count), count: row.count }))
      .sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind, 'ru')),
  }
}
