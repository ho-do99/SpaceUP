import type { ButtonHTMLAttributes } from 'react'

interface ChoiceCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  isSelected: boolean
}

export default function ChoiceCard({
  isSelected,
  className = '',
  children,
  ...rest
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`flex h-full min-w-0 flex-1 items-center justify-center rounded-[8px] text-center transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected ? 'bg-white font-bold text-[#2563eb]' : 'bg-transparent font-medium text-[#64748b]'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
