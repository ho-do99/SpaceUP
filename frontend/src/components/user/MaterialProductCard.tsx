import type { MaterialProduct } from '@/mocks/estimateMaterials'

interface MaterialProductCardProps {
  product: MaterialProduct
  isSelected: boolean
  onChange: (id: string) => void
}

export default function MaterialProductCard({
  product,
  isSelected,
  onChange,
}: MaterialProductCardProps) {
  return (
    <label
      className={`relative flex min-h-[168px] cursor-pointer gap-3 rounded-[10px] border bg-white p-[13px] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2563eb] ${
        isSelected ? 'border-2 border-[#2563eb] bg-[#f8fbff]' : 'border-[#d5dfed]'
      }`}
    >
      <input
        type="radio"
        name={`${product.category}-material`}
        value={product.id}
        checked={isSelected}
        className="sr-only"
        onChange={() => onChange(product.id)}
      />
      <img
        src={product.thumbnailSrc}
        alt={product.thumbnailAlt}
        className="mt-0.5 size-[72px] shrink-0 rounded-[8px] border border-[#d5dfed] object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="break-keep text-[16px] font-bold leading-5 text-[#1e293b]">
            {product.name}
          </span>
          {product.isAiRecommended && (
            <span className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-medium text-[#2563eb]">
              AI 추천
            </span>
          )}
        </span>
        <span className="mt-1 block text-[11px] leading-4 text-[#64748b]">
          {product.brandDetail}
        </span>
        <span className="mt-2 block break-keep text-[11px] leading-[17px] text-[#334155]">
          {product.materialCost}
        </span>
        <span className="mt-1 block text-[11px] leading-[17px] text-[#334155]">
          {product.installationCost}
        </span>
        <span className="mt-5 block text-[12px] font-bold leading-[18px] text-[#2563eb]">
          {product.totalLabel}
        </span>
        {product.category === 'wallpaper' && (
          <span className="mt-0.5 block text-[10px] leading-[14px] text-[#334155]">
            15x1m가 1롤입니다.
          </span>
        )}
      </span>
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 flex size-5 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white"
        >
          ✓
        </span>
      )}
    </label>
  )
}
