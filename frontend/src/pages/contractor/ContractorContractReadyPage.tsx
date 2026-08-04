import { Navigate, useNavigate, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { contractorDefaultEstimateDraft, findContractorSentEstimate } from '@/mocks/contractorPortalMockData'
import ContractorEstimateNotFound from './ContractorEstimateNotFound'

export default function ContractorContractReadyPage() {
  const { estimateId } = useParams()
  const navigate = useNavigate()
  const estimate = findContractorSentEstimate(estimateId)
  const { estimateDraft, estimateLifecycleStatus, estimateValidUntil, completeContractConversion } = useContractorPortalFlow()
  if (!estimate) return <ContractorEstimateNotFound />
  if (estimateLifecycleStatus !== 'ACCEPTED') return <Navigate to={`/contractor/estimates/${estimate.estimateId}`} replace />
  const draft = estimateDraft ?? contractorDefaultEstimateDraft

  return (
    <ContractorMobileShell>
      <ContractorAppBar title="계약 전환" back />
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">승인된 견적을 계약으로 전환하기 전 내용을 확인하세요.</p>
        <ContractorSectionCard className="mt-3">
          <p className="text-[13px] font-bold text-[#1e293b]">{estimate.estimateId} · 견적 승인</p>
          <p className="mt-2 text-[11px] leading-5 text-[#64748b]">{estimate.region} ○○아파트 · 최종 견적 {formatWon(estimate.finalAmount)}<br />사용자 {estimate.customerName} · 유효기간 {estimateValidUntil.replace(/-/g, '.')}<br />사용자 선택 바닥재·벽지·조명 · 실제 견적 바닥재·벽지</p>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-4" title="계약 전환 정보">
          <dl className="space-y-2">
            <ContractorEstimateInfoRow label="연결 의뢰번호">{estimate.requestId}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="시공사명">{estimate.contractorName}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="시공 시작 예정일">{draft.condition.startDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="예상 시공 기간">{draft.condition.durationDays}일</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="결제 비율">{draft.condition.paymentTerms.depositPercent}% · {draft.condition.paymentTerms.interimPercent}% · {draft.condition.paymentTerms.balancePercent}%</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="A/S 보증기간">{draft.condition.warrantyLabel}</ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-4" title="계약 전환 체크">
          <ul className="space-y-2 text-xs leading-5 text-[#64748b]"><li>✓ 사용자 승인 견적 확인</li><li>✓ 조명 현장 실측 후 별도 협의 · 견적 금액 미포함</li><li>✓ 최종 견적 금액 확인</li><li>✓ 예상 공사 기간 확인</li></ul>
        </ContractorSectionCard>
        <button type="button" onClick={() => { completeContractConversion(); navigate('/contractor/projects') }} className="mt-4 h-12 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]">계약 전환 완료</button>
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
  )
}
