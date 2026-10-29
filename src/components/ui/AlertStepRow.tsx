import { INTERVAL_CHOICES } from '../../domain/alertPresets'
import { ChoiceChip } from './ChoiceChip'
import { NumberInput } from './NumberInput'

export function AlertStepRow({
  index,
  minutes,
  custom,
  onSelect,
  onCustom,
}: {
  index: number
  minutes: number
  custom: boolean
  onSelect: (minutes: number) => void
  onCustom: (text: string) => void
}) {
  return (
    <div className="alert-step">
      <strong>№ {index + 1}</strong>
      <div className="intervals">
        {INTERVAL_CHOICES.map((choice) => (
          <ChoiceChip key={choice} selected={!custom && minutes === choice} onClick={() => onSelect(choice)}>
            {choice} мин
          </ChoiceChip>
        ))}
      </div>
      <NumberInput value={custom ? String(minutes) : ''} onChange={onCustom} />
    </div>
  )
}
