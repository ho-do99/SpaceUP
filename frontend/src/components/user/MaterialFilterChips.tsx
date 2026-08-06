import { materialFilters, type MaterialFilterId } from '@/mocks/estimateMaterials'

interface MaterialFilterChipsProps {
  value: MaterialFilterId
  onChange: (value: MaterialFilterId) => void
}

export default function MaterialFilterChips({ value, onChange }: MaterialFilterChipsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="자재 필터"
      className="scrollbar-hide -mx-5 flex h-11 gap-2 overflow-x-auto px-5 py-1.5"
    >
      {materialFilters.map((filter) => {
        const isSelected = filter.id === value

        return (
          <button
            key={filter.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`h-8 shrink-0 rounded-full border px-[18px] text-[11px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2563eb] ${
              isSelected
                ? 'border-[#93c5fd] bg-[#eff6ff] font-bold text-[#2563eb]'
                : 'border-[#d5dfed] bg-white text-[#64748b]'
            }`}
            onClick={() => onChange(filter.id)}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
