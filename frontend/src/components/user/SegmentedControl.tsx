import ChoiceCard from '@/components/user/ChoiceCard'

interface SegmentedOption<T extends string> {
  label: string
  value: T
}

interface SegmentedControlProps<T extends string> {
  ariaLabel: string
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  inset?: 'three' | 'four'
  textSize?: 'sm' | 'md'
}

export default function SegmentedControl<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  inset = 'four',
  textSize = 'sm',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex h-11 w-full rounded-[10px] bg-[#f1f5f9] ${
        inset === 'three' ? 'p-[3px]' : 'p-1'
      }`}
    >
      {options.map((option) => (
        <ChoiceCard
          key={option.value}
          isSelected={value === option.value}
          className={textSize === 'md' ? 'text-[14px]' : 'text-[12px] leading-[18px]'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </ChoiceCard>
      ))}
    </div>
  )
}
