import type { ContractorEstimateDraft } from '@/types/contractorPortal'
import { calculateAdditionalTotal, calculateEstimateTotal, calculateSupplyAmount, calculateVatAmount, formatWon } from './contractorEstimateUtils'
import ContractorEstimateInfoRow from './ContractorEstimateInfoRow'

export default function ContractorEstimateSummary({ draft, preview = false }: { draft: ContractorEstimateDraft; preview?: boolean }) {
  const floor = draft.categories.find((category) => category.id === 'floor')
  const wallpaper = draft.categories.find((category) => category.id === 'wallpaper')
  const lighting = draft.categories.find((category) => category.id === 'lighting')

  return (
    <dl className="space-y-2">
      {!preview ? <ContractorEstimateInfoRow label="바닥재 합계">{formatWon(floor?.sectionTotal ?? 0)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="벽지 합계">{formatWon(wallpaper?.sectionTotal ?? 0)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="조명 합계">{formatWon(lighting?.sectionTotal ?? 0)}</ContractorEstimateInfoRow> : null}
      {!preview ? <ContractorEstimateInfoRow label="추가 비용">{formatWon(calculateAdditionalTotal(draft))}</ContractorEstimateInfoRow> : null}
      <ContractorEstimateInfoRow label="공급가액">{formatWon(calculateSupplyAmount(draft))}</ContractorEstimateInfoRow>
      <ContractorEstimateInfoRow label="부가세 (10%)">{formatWon(calculateVatAmount(draft))}</ContractorEstimateInfoRow>
      <div className="border-t border-[#e2e8f0] pt-3">
        <ContractorEstimateInfoRow label="최종 금액" emphasize>{formatWon(calculateEstimateTotal(draft))}</ContractorEstimateInfoRow>
      </div>
    </dl>
  )
}
