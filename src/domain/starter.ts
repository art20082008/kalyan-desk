import type { Flavor } from '../types'

const STARTER: [string, string][] = [
  ['Darkside', 'Bloody Orange'],
  ['Darkside', 'Darksupra'],
  ['Darkside', 'Supernova'],
  ['Darkside', 'Wild Forest'],
  ['Musthave', 'Pinkman'],
  ['Musthave', 'Earl Grey'],
  ['Black Burn', 'На чилле'],
  ['Black Burn', 'Кислая вишня'],
  ['Black Burn', 'Виноградный чупа-чупс'],
  ['Deus', 'Red'],
  ['Deus', 'Raspberry'],
  ['Deus', 'Yuzu'],
  ['Satyr', 'California Cola'],
  ['Starline', 'Бельгийские вафли'],
  ['Starline', 'Груша'],
  ['Starline', 'Маракуйя'],
  ['Сарма', 'Северная черника'],
  ['Сарма', 'Кедровый пломбир'],
  ['Bonche', 'Мятный джулеп'],
  ['Bonche', 'Гимлет'],
  ['Element', 'Pineapple Holls'],
  ['Догма', 'Плов'],
  ['Догма', 'Сакура'],
  ['Burn', 'Цитрусовый чай'],
]

export function starterFlavors(): Flavor[] {
  return STARTER.map(([brand, name], index) => ({
    id: `starter-${index + 1}`,
    brand,
    name,
    status: 'shelf' as const,
  }))
}
