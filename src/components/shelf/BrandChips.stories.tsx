import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BrandChips } from './BrandChips'
import { flavors } from '../../stories/fixtures'

const meta = {
  title: 'Полка/BrandChips',
  component: BrandChips,
  tags: ['autodocs'],
  args: { flavors, active: null, onChange: fn() },
} satisfies Meta<typeof BrandChips>

export default meta
type Story = StoryObj<typeof meta>

export const AllBrands: Story = {}
export const BrandSelected: Story = { args: { active: 'Darkside' } }
export const Empty: Story = { args: { flavors: [] } }

/** Интерактив: клик по чипу выбирает бренд, повторный клик снимает выбор. */
export const Interactive: Story = {
  render: function InteractiveRender(args) {
    const [active, setActive] = useState<string | null>(null)
    return (
      <BrandChips
        {...args}
        active={active}
        onChange={(brand) => {
          setActive(brand)
          args.onChange(brand)
        }}
      />
    )
  },
}
