import type { MaterialProduct } from '@/mocks/estimateMaterials'

interface MaterialSummaryCardProps {
  title: string
  product: MaterialProduct
  onSelect: () => void
}

export default function MaterialSummaryCard({
  title,
  product,
  onSelect,
}: MaterialSummaryCardProps) {
  const displayTotal = product.totalLabel.replace(
    /^(항목 )?예상 합계\s*/,
    '',
  )

  return (
    <article className="rounded-[6px] border border-[#e1e6ee] bg-white p-3">
      <h2 className="text-[13px] font-bold leading-5 text-[#15284c]">
        {title}
      </h2>

      <p className="mt-1.5 text-[10px] leading-4 text-[#657187]">
        {product.name}
      </p>

      <div className="mt-1.5 flex items-start gap-3">
        <img
          src={product.thumbnailSrc}
          alt={product.thumbnailAlt}
          className="size-10 shrink-0 rounded-[8px] border border-[#e2e8f0] object-cover"
        />

        <dl className="min-w-0 flex-1">
          {product.summaryCostRows.map((row) => (
            <div
              key={row.label}
              className="flex min-h-5 items-center justify-between gap-2 text-[10px] leading-4"
            >
              <dt className="text-[#657187]">{row.label}</dt>
              <dd className="shrink-0 text-right text-[#15284c]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-1.5 flex min-h-5 items-center justify-between border-t border-[#e1e6ee] pt-1 text-[10px] leading-4">
        <span className="text-[#657187]">항목 예상 합계</span>
        <strong className="font-bold text-[#2563eb]">
          {displayTotal}
        </strong>
      </div>

      <p className="mt-1 break-keep text-[9px] leading-[14px] text-[#657187]">
        {product.summaryDescription}
      </p>

      <div className="mt-1.5 flex flex-col items-start gap-1.5">
        {product.isAiRecommended && (
          <span className="inline-flex h-6 min-w-[76px] items-center justify-center rounded-[8px] bg-[#eff6ff] px-4 text-[12px] font-medium text-[#2563eb]">
            AI 추천
          </span>
        )}

        <button
          type="button"
          className="h-[30px] min-w-[84px] rounded-[6px] border border-[#2563eb] bg-white px-4 text-[11px] font-bold text-[#2563eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          onClick={onSelect}
        >
          선택
        </button>
      </div>
    </article>
  )
}