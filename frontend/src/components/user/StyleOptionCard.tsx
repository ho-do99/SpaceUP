import selectionCheckIcon from '@/assets/user/icons/selection-check.svg'
import type { InteriorStyleOption } from '@/mocks/interiorStyles'

interface StyleOptionCardProps {
  option: InteriorStyleOption
  isSelected: boolean
  onChange: (id: InteriorStyleOption['id']) => void
}

export default function StyleOptionCard({
  option,
  isSelected,
  onChange,
}: StyleOptionCardProps) {
  return (
    <label
      className={`relative flex min-h-[222px] min-w-0 cursor-pointer flex-col rounded-[12px] border p-[9px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2563eb] ${
        isSelected
          ? 'border-2 border-[#2563eb] bg-[#eff6ff]'
          : 'border-[#cbd5e1] bg-white'
      }`}
    >
      <input
        type="radio"
        name="interior-style"
        value={option.id}
        checked={isSelected}
        className="sr-only"
        onChange={() => onChange(option.id)}
      />
      <img
        src={option.imageSrc}
        alt={option.imageAlt}
        className="aspect-[146/112] w-full rounded-[8px] object-cover"
      />
      <span className="mt-[7px] block text-[16px] font-bold leading-[23px] text-[#1e293b]">
        {option.name}
      </span>
      <span className="mt-1 block break-keep text-[12px] leading-[18px] text-[#64748b]">
        {option.description}
      </span>
      {isSelected && (
        <img
          src={selectionCheckIcon}
          alt=""
          className="absolute right-[9px] top-[9px] size-6"
        />
      )}
    </label>
  )
}
