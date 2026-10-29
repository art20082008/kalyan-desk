import type { OrderLine } from '../types'
import { formatDateTime } from './format'

export function orderText(lines: OrderLine[], now: number): string {
  const groups = new Map<string, string[]>()
  for (const line of lines) {
    const list = groups.get(line.brand) ?? []
    list.push(line.name)
    groups.set(line.brand, list)
  }
  const blocks = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'ru'))
    .map(([brand, names]) => `${brand}\n${names.sort((a, b) => a.localeCompare(b, 'ru')).map((name) => `— ${name}`).join('\n')}`)
  return [`Заявка, кальянная Малевич`, formatDateTime(now), '', ...blocks].join('\n').trim()
}
