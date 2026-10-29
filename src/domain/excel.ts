import * as XLSX from 'xlsx'
import type { Flavor, OrderRequest, SmokingSession } from '../types'
import { brandBreakdown, currentEnded, smokingAverage, topFlavors } from './analytics'
import { formatDateTime } from './format'

export function workbookBase64(sheets: { name: string; rows: (string | number)[][] }[]): string {
  const book = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const table = XLSX.utils.aoa_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(book, table, sheet.name.slice(0, 31))
  }
  return XLSX.write(book, { bookType: 'xlsx', type: 'base64' }) as string
}

export function requestWorkbook(lines: { brand: string; name: string }[], now: number): string {
  const rows: (string | number)[][] = [
    ['Заявка, кальянная Малевич', formatDateTime(now)],
    [],
    ['Бренд', 'Вкус'],
    ...[...lines].sort((a, b) => a.brand.localeCompare(b.brand, 'ru') || a.name.localeCompare(b.name, 'ru')).map((line) => [line.brand, line.name]),
  ]
  return workbookBase64([{ name: 'Заявка', rows }])
}

export function analyticsWorkbook(
  requests: OrderRequest[],
  flavors: Flavor[],
  sessions: SmokingSession[],
  now: number,
): string {
  const top = topFlavors(requests)
  const brands = brandBreakdown(requests)
  const ended = currentEnded(flavors)
  const smoking = smokingAverage(sessions)
  const smokingRows: (string | number)[][] = [
    ['Показатель', 'Значение'],
    ['Выгружено', formatDateTime(now)],
    ['Среднее время курения, мин', smoking.averageMin ?? 'Нет сессий'],
    ['Сессий', smoking.count],
    [],
    ['Вид кальяна', 'Среднее, мин', 'Сессий'],
    ...(smoking.byKind.length
      ? smoking.byKind.map((row) => [row.kind, row.averageMin, row.count])
      : [['Нет данных', '', '']]),
  ]
  return workbookBase64([
    {
      name: 'Топ вкусов',
      rows: [
        ['Бренд', 'Вкус', 'Раз заканчивался'],
        ...(top.length ? top.map((row) => [row.brand, row.name, row.count]) : [['Нет данных', '', '']]),
      ],
    },
    {
      name: 'Бренды',
      rows: [
        ['Бренд', 'Порций в заявках'],
        ...(brands.length ? brands.map((row) => [row.brand, row.count]) : [['Нет данных', '']]),
      ],
    },
    {
      name: 'Закончившиеся',
      rows: [
        ['Бренд', 'Вкус', 'Где сейчас'],
        ...(ended.length
          ? ended.map((row) => [row.brand, row.name, row.status === 'request' ? 'В заявке' : 'Стоп-лист'])
          : [['Нет данных', '', '']]),
      ],
    },
    { name: 'Курение', rows: smokingRows },
  ])
}
