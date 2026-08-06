import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorBottomNavigation from '@/components/contractor/ContractorBottomNavigation'
import ContractorEstimateDetails from '@/components/contractor/ContractorEstimateDetails'
import ContractorEstimateLifecycleBadge from '@/components/contractor/ContractorEstimateLifecycleBadge'
import { getEstimateLifecycleLabel } from '@/components/contractor/contractorEstimateLifecycleUtils'
import ContractorEstimateValidityDialog from '@/components/contractor/ContractorEstimateValidityDialog'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { contractorDefaultEstimateDraft, findContractorRequestDetail, findContractorSentEstimate } from '@/mocks/contractorPortalMockData'
import ContractorEstimateNotFound from './ContractorEstimateNotFound'

export default function ContractorEstimateDetailPage() {
  const { estimateId } = useParams()
  const estimate = findContractorSentEstimate(estimateId)
  const request = findContractorRequestDetail(estimate?.requestId)
  const {
    estimateDraft, estimateLifecycleStatus, estimateValidUntil, estimateViewedAt,
    revisionRequest, revisionSubmittedAt, estimateAcceptedAt, validityExtension,
    markEstimateViewed, showEstimateRevisionRequest, acceptEstimate, extendEstimateValidity,
  } = useContractorPortalFlow()
  const [validityOpen, setValidityOpen] = useState(false)
  const closeValidity = useCallback(() => setValidityOpen(false), [])

  if (!estimate || !request) return <ContractorEstimateNotFound />
  const draft = estimateDraft ?? contractorDefaultEstimateDraft

  const saveValidity = (validUntil: string, note: string) => {
    extendEstimateValidity(validUntil, note)
    setValidityOpen(false)
  }

  return (
    <>
      <ContractorMobileShell innerClassName="h-dvh min-h-0">
        <ContractorAppBar title="보낸 견적 상세" back />
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
          <p className="text-xs leading-5 text-[#64748b]">견적 버전과 사용자 요청 내용을 확인하세요.</p>
          <ContractorSectionCard className="mt-3">
            <div className="flex min-w-0 items-start justify-between gap-2"><p className="break-all text-sm font-bold text-[#2563eb]">{estimate.estimateId}</p><ContractorEstimateLifecycleBadge status={estimateLifecycleStatus} /></div>
            <p className="mt-2 break-words text-xs leading-5 text-[#64748b]">{estimate.region} ○○아파트 바닥재 및 벽지 시공<br />견적 5,500,000원 · 유효 {estimateValidUntil.replace(/-/g, '.')}</p>
          </ContractorSectionCard>

          <ContractorSectionCard className="mt-3" title={getEstimateLifecycleLabel(estimateLifecycleStatus)}>
            {estimateLifecycleStatus === 'SUBMITTED' ? <p className="text-xs leading-5 text-[#64748b]">아직 사용자가 견적을 확인하지 않았습니다.</p> : null}
            {estimateLifecycleStatus === 'VIEWING' ? <p className="text-xs leading-5 text-[#64748b]">사용자가 견적 내용을 확인하고 있습니다.{estimateViewedAt ? ` · ${estimateViewedAt.replace(/-/g, '.')}` : ''}</p> : null}
            {estimateLifecycleStatus === 'REVISION_REQUESTED' ? <p className="text-xs leading-5 text-[#64748b]">{revisionRequest.requestedBy} · {revisionRequest.requestedAt.replace(/-/g, '.')}<br />{revisionRequest.reason}</p> : null}
            {estimateLifecycleStatus === 'RESUBMITTED' ? <p className="text-xs leading-5 text-[#64748b]">수정 견적이 재전송 상태로 반영되었습니다.{revisionSubmittedAt ? ` · ${revisionSubmittedAt.replace(/-/g, '.')}` : ''}</p> : null}
            {estimateLifecycleStatus === 'ACCEPTED' ? <p className="text-xs leading-5 text-[#64748b]">승인된 견적을 확인하고 계약 전환을 진행하세요.{estimateAcceptedAt ? ` · 승인 ${estimateAcceptedAt.replace(/-/g, '.')}` : ''}</p> : null}
          </ContractorSectionCard>

          {estimateLifecycleStatus === 'REVISION_REQUESTED' ? (
            <ContractorSectionCard className="mt-3" title="수정 요청 내용">
              <p className="text-xs leading-5 text-[#64748b]">{revisionRequest.reason}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] leading-5 text-[#64748b]">{revisionRequest.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </ContractorSectionCard>
          ) : null}

          {validityExtension ? <div role="status" aria-live="polite" className="mt-3 rounded-xl bg-[#ecfdf5] px-4 py-3 text-xs font-bold text-[#047857]">유효일이 {validityExtension.extendedValidUntil.replace(/-/g, '.')}로 반영되었습니다.</div> : null}

          <div className="mt-3 space-y-3">
            {estimateLifecycleStatus === 'SUBMITTED' ? <button type="button" onClick={markEstimateViewed} className="h-12 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white">사용자 확인 중</button> : null}
            {estimateLifecycleStatus === 'VIEWING' ? <button type="button" onClick={showEstimateRevisionRequest} className="h-12 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white">수정 요청 내용 확인</button> : null}
            {estimateLifecycleStatus === 'REVISION_REQUESTED' ? <Link to={`/contractor/requests/${estimate.requestId}/estimate`} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white">수정 견적 작성</Link> : null}
            {estimateLifecycleStatus === 'RESUBMITTED' ? <button type="button" onClick={acceptEstimate} className="h-12 w-full rounded-xl bg-[#2563eb] text-sm font-bold text-white">사용자 승인 확인</button> : null}
            {estimateLifecycleStatus === 'ACCEPTED' ? <Link to={`/contractor/estimates/${estimate.estimateId}/contract-ready`} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white">계약 전환</Link> : null}
            {estimateLifecycleStatus !== 'ACCEPTED' ? <button type="button" onClick={() => setValidityOpen(true)} className="h-12 w-full rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b]">유효기간 연장</button> : <button type="button" disabled aria-disabled="true" className="h-12 w-full rounded-xl bg-[#e2e8f0] text-sm font-bold text-[#94a3b8]">수정 견적 작성</button>}
          </div>

          <ContractorEstimateDetails estimate={estimate} request={request} draft={draft} validUntil={estimateValidUntil} />
        </main>
        <ContractorBottomNavigation />
      </ContractorMobileShell>
      <ContractorEstimateValidityDialog open={validityOpen} currentValidUntil={estimateValidUntil} onClose={closeValidity} onSave={saveValidity} />
    </>
  )
}
