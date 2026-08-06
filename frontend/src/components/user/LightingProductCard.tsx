import lightingGlow from '@/assets/user/icons/lighting-glow.svg'
import type { LightingProduct } from '@/mocks/estimateMaterials'

interface LightingProductCardProps {
  product: LightingProduct
  isSelected: boolean
  onChange: (id: string) => void
}

export default function LightingProductCard({
  product,
  isSelected,
  onChange,
}: LightingProductCardProps) {
  return (
    <label
      className={`relative block min-h-[160px] cursor-pointer rounded-[8px] border bg-white px-3 py-2.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#2563eb] ${
        isSelected ? 'border-2 border-[#2563eb] bg-[#f8fbff]' : 'border-[#d5dfed]'
      }`}
    >
      <input
        type="radio"
        name="lighting-material"
        value={product.id}
        checked={isSelected}
        className="sr-only"
        onChange={() => onChange(product.id)}
      />

      <span className="flex gap-3">
        <span
          aria-hidden="true"
          className="relative flex size-[72px] shrink-0 items-start justify-center rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] pt-[15px]"
        >
          <span className="h-[18px] w-[42px] rounded-[8px] border border-[#94a3b8] bg-white" />
          <img src={lightingGlow} alt="" className="absolute left-6 top-[36px] h-3 w-6" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="break-keep text-[13px] font-bold leading-[18px] text-[#1e293b]">
              {product.name}
            </span>
            {product.isAiRecommended && (
              <span className="shrink-0 rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-bold text-[#2563eb]">
                AI 추천
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[10px] leading-[14px] text-[#64748b]">
            {product.brandDetail}
          </span>
          <span className="mt-0.5 block text-[10px] leading-[14px] text-[#475569]">
            {product.roomLabel}
          </span>
          <span className="block text-[10px] leading-[14px] text-[#475569]">
            {product.specification}
          </span>
          <span className="mt-0.5 block text-[9px] leading-[13px] text-[#334155]">
            {product.materialPriceLabel} · {product.removalPriceLabel}
          </span>
          <span className="block text-[9px] leading-[13px] text-[#334155]">
            {product.laborPriceLabel}
          </span>
        </span>
      </span>

      <span className="mt-1.5 block break-keep text-[9px] leading-[13px] text-[#64748b]">
        {product.summaryDescription}
      </span>
      <span className="mt-2 block text-[11px] font-bold leading-4 text-[#2563eb]">
        {product.totalLabel}
      </span>

      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 flex size-[22px] items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-bold text-white"
        >
          ✓
        </span>
      )}
    </label>
  )
}
