import type { AnalyzedSpaceOption } from '@/mocks/analysisSpaces'

interface SpaceSelectionCardProps {
  option: AnalyzedSpaceOption
  isSelected: boolean
  onToggle: (id: AnalyzedSpaceOption['id']) => void
}

export default function SpaceSelectionCard({
  option,
  isSelected,
  onToggle,
}: SpaceSelectionCardProps) {
  const isDisabled = !option.isRecommendationSupported

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={isDisabled}
      className={`relative flex h-[88px] min-w-0 items-start rounded-[10px] border px-[13px] pt-[17px] pr-11 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-100 ${
        isSelected
          ? 'border-2 border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
          : isDisabled
            ? 'border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]'
            : 'border-[#e2e8f0] bg-white text-[#64748b]'
      }`}
      onClick={() => onToggle(option.id)}
    >
      <span className="min-w-0">
        <span
          className={`block truncate text-[15px] font-bold leading-[22px] ${
            isSelected ? 'text-[#2563eb]' : isDisabled ? 'text-[#94a3b8]' : 'text-[#1e293b]'
          }`}
        >
          {option.name}
        </span>
        {isDisabled && (
          <span className="mt-0.5 block break-keep text-[11px] leading-[18px] text-[#94a3b8]">
            현재 추천 미지원
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] border-2 ${
          isSelected
            ? 'border-[#2563eb] bg-[#2563eb] text-white'
            : isDisabled
              ? 'border-[#cbd5e1] bg-[#f1f5f9] text-transparent'
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
