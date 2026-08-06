import type { ContractorEstimateDraft } from '@/types/contractorPortal'
import { calculateAdditionalTotal, calculateEstimateTotal, formatWon } from './contractorEstimateUtils'
import ContractorEstimateInfoRow from './ContractorEstimateInfoRow'

export default function ContractorEstimateSummary({ draft, preview = false }: { draft: ContractorEstimateDraft; preview?: boolean }) {
  const floor = draft.categories.find((category) => category.id === 'floor')
  const wallpaper = draft.categories.find((category) => category.id === 'wallpaper')

  return (
    <dl className="space-y-2">
      {preview ? <ContractorEstimateInfoRow label="공급가액">{formatWon(draft.supplyAmount)}</ContractorEstimateInfoRow> : null}
      {preview ? <ContractorEstimateInfoRow label="부가세">{formatWon(draft.vatAmount)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="바닥재 합계">{formatWon(floor?.sectionTotal ?? 0)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="벽지 합계">{formatWon(wallpaper?.sectionTotal ?? 0)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="추가 비용">{formatWon(calculateAdditionalTotal(draft))}</ContractorEstimateInfoRow> : null}
      <ContractorEstimateInfoRow label="할인 금액">-{formatWon(draft.discountAmount)}</ContractorEstimateInfoRow>
      <div className="border-t border-[#e2e8f0] pt-3">
        <ContractorEstimateInfoRow label="시공사 제안 견적" emphasize>{formatWon(calculateEstimateTotal(draft))}</ContractorEstimateInfoRow>
      </div>
    </dl>
  )
}
