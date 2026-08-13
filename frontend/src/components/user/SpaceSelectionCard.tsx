import { formatSpaceArea } from '@/utils/spaceArea'

interface SpaceSelectionCardProps {
  spaceName: string
  areaM2?: number | null
  isSelected: boolean
  onToggle: () => void
}

export default function SpaceSelectionCard({
  spaceName,
  areaM2,
  isSelected,
  onToggle,
}: SpaceSelectionCardProps) {
  const areaLabel = areaM2 === undefined ? null : formatSpaceArea(areaM2)

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={`relative flex min-h-[96px] min-w-0 items-start rounded-[10px] border px-[13px] py-[17px] pr-11 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] ${
        isSelected
          ? 'border-2 border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
          : 'border-[#e2e8f0] bg-white text-[#64748b]'
      }`}
      onClick={onToggle}
    >
      <span className="min-w-0">
        <span
          className={`block truncate text-[15px] font-bold leading-[22px] ${
            isSelected ? 'text-[#2563eb]' : 'text-[#1e293b]'
          }`}
        >
          {spaceName}
        </span>
        {areaLabel ? (
          <span className="mt-1 block whitespace-nowrap text-[11px] font-medium leading-4 text-[#64748b]">
            {areaLabel}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={`absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] border-2 ${
          isSelected
            ? 'border-[#2563eb] bg-[#2563eb] text-white'
            : 'border-[#94a3b8] bg-white text-transparent'
        }`}
      >
        <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 10 4 4 8-8" />
        </svg>
      </span>
    </button>
  )
}
