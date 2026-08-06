import ContractorEstimateCostList from './ContractorEstimateCostList'
import ContractorEstimateInfoRow from './ContractorEstimateInfoRow'
import ContractorEstimateSummary from './ContractorEstimateSummary'
import ContractorSectionCard from './ContractorSectionCard'
import { calculateAdditionalTotal, formatWon } from './contractorEstimateUtils'
import type { ContractorEstimateDraft, ContractorRequestDetail, ContractorSentEstimate } from '@/types/contractorPortal'

interface ContractorEstimateDetailsProps {
  estimate: ContractorSentEstimate
  request: ContractorRequestDetail
  draft: ContractorEstimateDraft
  validUntil: string
}

export default function ContractorEstimateDetails({ estimate, request, draft, validUntil }: ContractorEstimateDetailsProps) {
  return (
    <>
      <ContractorSectionCard className="mt-4" title="사용자 및 현장 정보">
        <dl className="space-y-2">
          <ContractorEstimateInfoRow label="사용자명">{estimate.customerName}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="의뢰번호">{estimate.requestId}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="현장 주소">{estimate.address}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="주택 정보">{estimate.propertyType} · {estimate.areaLabel}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="현장 방문일">2026.07.24</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="시공 예정일">{draft.condition.startDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="전송일">{estimate.submittedDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="유효일">{validUntil.replace(/-/g, '.')}</ContractorEstimateInfoRow>
        </dl>
      </ContractorSectionCard>
      <ContractorSectionCard className="mt-4" title="실제 견적 항목 · 바닥재 · 벽지">
        <div className="space-y-5">{draft.categories.map((category) => <ContractorEstimateCostList key={category.id} category={category} />)}</div>
        <p className="mt-4 rounded-lg bg-[#eff6ff] p-3 text-[11px] leading-5 text-[#2563eb]">사용자 선택: {request.selectedItems.join(' · ')}<br />조명은 현장 실측 후 별도 협의<br />현재 견적 금액 미포함</p>
      </ContractorSectionCard>
      <ContractorSectionCard className="mt-4" title="추가 비용">
        <dl className="space-y-2">
          {draft.additionalCosts.map((item) => <ContractorEstimateInfoRow key={item.id} label={item.label}>{formatWon(item.amount)}</ContractorEstimateInfoRow>)}
          <ContractorEstimateInfoRow label="추가 비용 합계" emphasize>{formatWon(calculateAdditionalTotal(draft))}</ContractorEstimateInfoRow>
        </dl>
      </ContractorSectionCard>
      <ContractorSectionCard className="mt-4" title="최종 금액 (VAT 포함)"><ContractorEstimateSummary draft={draft} preview /></ContractorSectionCard>
      <ContractorSectionCard className="mt-4" title="시공 조건">
        <dl className="space-y-2">
          <ContractorEstimateInfoRow label="시공 예정일">{draft.condition.startDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="예상 기간">{draft.condition.durationDays}일</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="결제 비율">계약금 {draft.condition.paymentTerms.depositPercent}% · 중도금 {draft.condition.paymentTerms.interimPercent}% · 잔금 {draft.condition.paymentTerms.balancePercent}%</ContractorEstimateInfoRow>
          <ContractorEstimateInfoRow label="A/S 보증기간">{draft.condition.warrantyLabel}</ContractorEstimateInfoRow>
        </dl>
      </ContractorSectionCard>
      <ContractorSectionCard className="mt-4" title="특이사항"><p className="whitespace-pre-line break-words text-xs leading-5 text-[#64748b]">{draft.notes || '등록된 특이사항이 없습니다.'}</p></ContractorSectionCard>
    </>
  )
}
