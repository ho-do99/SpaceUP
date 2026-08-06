import selectionCheckIcon from '@/assets/user/icons/selection-check.svg'
import type { AnalyzedSpaceOption, SpaceIconType } from '@/mocks/analysisSpaces'

interface SpaceSelectionCardProps {
  option: AnalyzedSpaceOption
  isSelected: boolean
  onToggle: (id: AnalyzedSpaceOption['id']) => void
}

function SpaceIcon({ type }: { type: SpaceIconType }) {
  const isShortRoom = type === 'room'
  const isBathroom = type === 'bathroom'
  const hasDivider = type === 'kitchen' || type === 'balcony'

  return (
    <span aria-hidden="true" className="relative block size-7 shrink-0">
      <span
        className={`absolute left-[3px] w-[22px] border-[1.5px] border-solid border-current ${
          isBathroom
            ? 'top-3 h-[10px] rounded-[5px]'
            : isShortRoom
              ? 'top-2.5 h-3 rounded-[3px]'
              : 'top-[5px] h-[18px] rounded-[3px]'
        }`}
      />
      {hasDivider && (
        <span className="absolute left-[3px] top-3 h-[1.5px] w-[22px] bg-current" />
      )}
    </span>
  )
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
      className={`relative flex h-[88px] min-w-0 items-start rounded-[10px] border px-[13px] pt-[17px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-100 ${
        isSelected
          ? 'border-2 border-[#2563eb] bg-[#eff6ff] text-[#2563eb]'
          : isDisabled
            ? 'border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]'
            : 'border-[#e2e8f0] bg-white text-[#64748b]'
      }`}
      onClick={() => onToggle(option.id)}
    >
      <SpaceIcon type={option.icon} />
      <span className="ml-2.5 min-w-0">
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
      {isSelected && (
        <img
          src={selectionCheckIcon}
          alt=""
          className="absolute right-1.5 top-1.5 size-6"
        />
      )}
    </button>
  )
}
