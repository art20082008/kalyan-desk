import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TimerCard } from './TimerCard'
import { alert, hookah, MIN, NOW } from '../../stories/fixtures'

const meta = {
  title: 'Ведение кальянов/TimerCard',
  component: TimerCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="timer-grid" style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    hookah: hookah(),
    now: NOW,
    focused: false,
    onEdit: fn(),
    onDelete: fn(),
    onToggle: fn(),
    onFinish: fn(),
    onAcknowledge: fn(),
  },
  argTypes: {
    now: { control: 'date' },
  },
} satisfies Meta<typeof TimerCard>

export default meta
type Story = StoryObj<typeof meta>

/** Кальян создан, таймер ещё не запускали. */
export const NotStarted: Story = {
  args: { hookah: hookah({ running: false, startedAt: null, elapsedBeforeMs: 0 }) },
}

/** Прогрев чаши: идёт обратный отсчёт до начала курения. */
export const Warmup: Story = {
  args: { hookah: hookah({ warmupMin: 3, startedAt: NOW - 1 * MIN }) },
}

/** Курится 12 минут, первый сигнал через 8 минут. */
export const Running: Story = {}

/** Почти пора: до первого сигнала 30 секунд. */
export const AlmostDue: Story = {
  args: { hookah: hookah({ startedAt: NOW - (19 * MIN + 30_000) }) },
}

/** Пауза на 15-й минуте. */
export const Paused: Story = {
  args: { hookah: hookah({ running: false, startedAt: null, elapsedBeforeMs: 15 * MIN }) },
}

/** Сработал таймер 1 из 3, кальян не самый ранний (жёлтая рамка). */
export const Alert: Story = {
  args: {
    hookah: hookah({
      startedAt: NOW - 21 * MIN,
      alerts: [alert(20, { firedAt: NOW - 1 * MIN }), alert(20), alert(20)],
    }),
  },
}

/** Самый ранний алерт в зале: на него сработает Пробел. */
export const AlertFocused: Story = {
  args: { ...Alert.args, focused: true },
}

/** Второй сигнал: первый принят через 1 мин, под карточкой видна реакция на стол. */
export const SecondAlertWithReaction: Story = {
  args: {
    hookah: hookah({
      startedAt: NOW - 42 * MIN,
      alerts: [
        alert(20, { firedAt: NOW - 22 * MIN, ackedAt: NOW - 21 * MIN, ackedSmokingMs: 21 * MIN }),
        alert(20, { firedAt: NOW - 1 * MIN }),
        alert(20),
      ],
    }),
  },
}

/** Все таймеры пройдены, кальян курится сверх плана (+07:00, красная рамка). */
export const Overtime: Story = {
  args: {
    hookah: hookah({
      startedAt: NOW - 67 * MIN,
      alerts: [
        alert(20, { firedAt: NOW - 47 * MIN, ackedAt: NOW - 47 * MIN, ackedSmokingMs: 20 * MIN }),
        alert(20, { firedAt: NOW - 27 * MIN, ackedAt: NOW - 27 * MIN, ackedSmokingMs: 40 * MIN }),
        alert(20, { firedAt: NOW - 7 * MIN, ackedAt: NOW - 7 * MIN, ackedSmokingMs: 60 * MIN }),
      ],
    }),
  },
}

/** Сессия завершена. */
export const Finished: Story = {
  args: {
    hookah: hookah({ running: false, startedAt: null, elapsedBeforeMs: 55 * MIN, finishedAt: NOW - 5 * MIN }),
  },
}

/** Без вкуса: строка вкуса не выводится. */
export const WithoutFlavor: Story = {
  args: { hookah: hookah({ flavorName: '' }) },
}

/** «Живые» часы: now обновляется раз в секунду, через 30 с сработает первый таймер. */
export const LiveClock: Story = {
  args: { hookah: hookah({ startedAt: NOW - (19 * MIN + 30_000) }) },
  render: function LiveClockRender(args) {
    const [now, setNow] = useState(args.now)
    useEffect(() => {
      const id = window.setInterval(() => setNow((t) => t + 1000), 1000)
      return () => window.clearInterval(id)
    }, [])
    return <TimerCard {...args} now={now} />
  },
}
