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
import useContractorQuote from '@/hooks/useContractorQuote'
import { contractorDefaultEstimateDraft, findContractorRequestDetail, findContractorSentEstimate } from '@/mocks/contractorPortalMockData'
import { extendQuote } from '@/api/estimateApi'
import { getSubmittedQuoteId } from '@/utils/quoteDraft'
import { quoteLifecycleStatus } from '@/utils/contractorQuoteAdapter'
import { requestToContractorDetail } from '@/utils/contractorRequestAdapter'
import ContractorEstimateNotFound from './ContractorEstimateNotFound'

export default function ContractorEstimateDetailPage() {
  const { estimateId } = useParams()
  const isLive = Boolean(estimateId && /^\d+$/.test(estimateId))
  const live = useContractorQuote(estimateId)
  const mockEstimate = isLive ? undefined : findContractorSentEstimate(estimateId)
  const mockRequest = isLive ? undefined : findContractorRequestDetail(mockEstimate?.requestId)
  const flow = useContractorPortalFlow()
  const [validityOpen, setValidityOpen] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [extendError, setExtendError] = useState('')
  const closeValidity = useCallback(() => { setValidityOpen(false); setExtendError('') }, [])

  if (isLive && live.loading) return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">견적을 불러오는 중입니다.</main></ContractorMobileShell>
  if (isLive && live.error) return <ContractorMobileShell><ContractorAppBar title="보낸 견적 상세" back /><main className="p-4"><p role="alert" className="rounded-lg bg-[#fef2f2] p-3 text-xs text-[#b91c1c]">{live.error}</p></main></ContractorMobileShell>

  const estimate = isLive ? live.view : mockEstimate
  const request = isLive && live.request ? requestToContractorDetail(live.request) : mockRequest
  const draft = isLive ? live.draft : (flow.estimateDraft ?? contractorDefaultEstimateDraft)
  const lifecycleStatus = isLive && live.quote ? quoteLifecycleStatus(live.quote) : flow.estimateLifecycleStatus
  const validUntil = isLive ? (live.quote?.validUntil || '-') : flow.estimateValidUntil
  if (!estimate || !request || !draft) return <ContractorEstimateNotFound />

  const saveValidity = async (newValidUntil: string, note: string) => {
    const quoteId = isLive ? Number(estimateId) : getSubmittedQuoteId(estimate.estimateId)
    if (!quoteId) { setExtendError('실제 견적 식별자를 찾을 수 없습니다.'); return }
    setIsExtending(true); setExtendError('')
    try {
      await extendQuote(quoteId, newValidUntil, note)
      if (!isLive) flow.extendEstimateValidity(newValidUntil, note)
      setValidityOpen(false)
    } catch (error) { setExtendError(error instanceof Error ? error.message : '견적 유효기간 연장에 실패했습니다.') }
    finally { setIsExtending(false) }
  }

  return <>
    <ContractorMobileShell innerClassName="h-dvh min-h-0">
      <ContractorAppBar title="보낸 견적 상세" back />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <p className="text-xs leading-5 text-[#64748b]">실제 견적과 사용자 요청 내용을 확인하세요.</p>
        <ContractorSectionCard className="mt-3">
          <div className="flex min-w-0 items-start justify-between gap-2"><p className="break-all text-sm font-bold text-[#2563eb]">견적 #{estimate.estimateId}</p><ContractorEstimateLifecycleBadge status={lifecycleStatus} /></div>
          <p className="mt-2 break-words text-xs leading-5 text-[#64748b]">{estimate.customerName} · {estimate.region}<br />견적 {estimate.finalAmount.toLocaleString('ko-KR')}원 · 유효 {validUntil.replace(/-/g, '.')}</p>
        </ContractorSectionCard>
        <ContractorSectionCard className="mt-3" title={getEstimateLifecycleLabel(lifecycleStatus)}>
          <p className="text-xs leading-5 text-[#64748b]">서버에 저장된 {live.quote?.phase ?? '견적'} 상태입니다.</p>
          {live.quote?.revisionRequestNote ? <p className="mt-2 text-xs text-[#b45309]">{live.quote.revisionRequestNote}</p> : null}
        </ContractorSectionCard>
        <div className="mt-3 space-y-3">
          {lifecycleStatus === 'REVISION_REQUESTED' ? <Link to={`/contractor/requests/${estimate.requestId}/estimate`} className="flex h-12 items-center justify-center rounded-xl bg-[#2563eb] text-sm font-bold text-white">수정 견적 작성</Link> : null}
          <button type="button" onClick={() => { setExtendError(''); setValidityOpen(true) }} className="h-12 w-full rounded-xl border border-[#e2e8f0] bg-white text-sm font-bold text-[#1e293b]">유효기간 연장</button>
        </div>
        <ContractorEstimateDetails estimate={estimate} request={request} draft={draft} validUntil={validUntil} />
      </main>
      <ContractorBottomNavigation />
    </ContractorMobileShell>
    <ContractorEstimateValidityDialog open={validityOpen} currentValidUntil={validUntil === '-' ? '' : validUntil} isSaving={isExtending} submitError={extendError} onClose={closeValidity} onSave={(value, note) => { void saveValidity(value, note) }} />
  </>
}
