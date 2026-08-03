import type { MaterialProduct } from '@/mocks/estimateMaterials'

interface MaterialSummaryCardProps {
  title: string
  product: MaterialProduct
  onSelect: () => void
}

export default function MaterialSummaryCard({ title, product, onSelect }: MaterialSummaryCardProps) {
  return (
    <article className="rounded-[7px] border border-[#d5dfed] bg-white px-3 py-3">
      <h2 className="text-[13px] font-bold leading-5 text-[#1e293b]">{title}</h2>
      <p className="mt-2 text-[10px] leading-4 text-[#64748b]">{product.name}</p>
      <div className="mt-2 flex items-start gap-3">
        <img
          src={product.thumbnailSrc}
          alt={product.thumbnailAlt}
          className="size-10 shrink-0 rounded-[6px] border border-[#d5dfed] object-cover"
        />
        <dl className="min-w-0 flex-1 space-y-1">
          {product.summaryCostRows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-2 text-[9px] leading-4">
              <dt className="text-[#64748b]">{row.label}</dt>
              <dd className="shrink-0 text-right text-[#334155]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-[#e2e8f0] pt-2 text-[10px]">
        <span className="text-[#64748b]">항목 예상 합계</span>
        <strong className="text-[#2563eb]">{product.totalLabel.replace('항목 예상 합계 ', '')}</strong>
      </div>
      <p className="mt-2 break-keep text-[9px] leading-4 text-[#64748b]">
        {product.summaryDescription}
      </p>
      <div className="mt-2 flex items-center justify-between">
        {product.isAiRecommended ? (
          <span className="rounded-full bg-[#eff6ff] px-5 py-1 text-[9px] font-medium text-[#2563eb]">
            AI 추천
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="h-8 min-w-[84px] rounded-[5px] border border-[#2563eb] bg-white px-4 text-[10px] font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          onClick={onSelect}
        >
          선택
        </button>
      </div>
    </article>
  )
}
