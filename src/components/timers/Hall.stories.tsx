import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Hall } from './Hall'
import { alert, hookah, MIN, NOW, tables } from '../../stories/fixtures'

const meta = {
  title: 'Ведение кальянов/Hall (схема зала)',
  component: Hall,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    tables,
    now: NOW,
    hookahs: [
      hookah({ id: 'h1', table: 'Стол 1', flavorName: 'Supernova', startedAt: NOW - 12 * MIN }),
      hookah({ id: 'h2', table: 'Стол 1', flavorName: 'Pinkman', startedAt: NOW - 33 * MIN }),
      hookah({
        id: 'h3',
        table: 'Стол 4',
        flavorName: 'Груша',
        startedAt: NOW - 21 * MIN,
        alerts: [alert(20, { firedAt: NOW - MIN }), alert(20)],
      }),
    ],
    onAddTable: fn(),
    onRemoveTable: fn(),
    onPick: fn(),
  },
} satisfies Meta<typeof Hall>

export default meta
type Story = StoryObj<typeof meta>

export const Busy: Story = {}
export const EmptyHall: Story = { args: { hookahs: [] } }
export const NoTables: Story = { args: { tables: [], hookahs: [] } }
