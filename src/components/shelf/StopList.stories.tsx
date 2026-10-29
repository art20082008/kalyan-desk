import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StopList } from './StopList'
import { flavors } from '../../stories/fixtures'

const meta = {
  title: 'Полка/StopList (Закончились)',
  component: StopList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="board" style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    flavors: flavors.filter((f) => f.status === 'stop'),
    onMove: fn(),
    onDrop: fn(),
  },
} satisfies Meta<typeof StopList>

export default meta
type Story = StoryObj<typeof meta>

export const WithFlavors: Story = {}
export const Empty: Story = { args: { flavors: [] } }
