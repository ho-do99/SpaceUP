import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import ContractorAppBar from '@/components/contractor/ContractorAppBar'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import {
  calculateEstimateTotal,
  formatWon,
} from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import useContractorQuote from '@/hooks/useContractorQuote'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import { getStoredQuoteId } from '@/utils/quoteDraft'

import ContractorRequestNotFound from './ContractorRequestNotFound'

export default function ContractorEstimateSentPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const isLive = /^\d+$/.test(requestId ?? '')
  const quoteId = isLive && requestId ? getStoredQuoteId(Number(requestId)) : null
  const liveQuote = useContractorQuote(quoteId ? String(quoteId) : undefined)

  const {
    estimateDraft,
    estimateStatus,
    estimateSubmission,
  } = useContractorPortalFlow()

  const request = isLive ? liveQuote.view : findContractorRequestDetail(requestId)
  const draft = isLive ? liveQuote.draft : estimateDraft
  const submission = isLive && liveQuote.quote && liveQuote.view
    ? {
        estimateNumber: `#${liveQuote.quote.id}`,
        submittedDate: liveQuote.view.submittedDate,
        validUntil: liveQuote.quote.validUntil || '-',
      }
    : estimateSubmission
  const submitted = isLive
    ? liveQuote.quote?.status !== 'DRAFT'
    : estimateStatus === 'SUBMITTED'

  const isCompletedView = searchParams.get('mode') === 'completed'
  const completedQuery = isCompletedView ? '?mode=completed' : ''

  if (isLive && quoteId && liveQuote.loading) {
    return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">보낸 견적을 불러오는 중입니다.</main></ContractorMobileShell>
  }

  if (isLive && (!quoteId || liveQuote.error)) {
    return (
      <ContractorMobileShell>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[#64748b]">
          <p role="alert">{liveQuote.error || '저장된 견적을 찾을 수 없습니다.'}</p>
          <Link className="font-bold text-[#2563eb]" to={`/contractor/requests/${requestId}/estimate${completedQuery}`}>견적 작성으로 돌아가기</Link>
        </main>
      </ContractorMobileShell>
    )
  }

  if (!request) {
    return <ContractorRequestNotFound />
  }

  if (!draft) {
    return <Navigate to={`/contractor/requests/${requestId}/estimate${completedQuery}`} replace />
  }

  if (!submitted || !submission) {
    return <Navigate to={`/contractor/requests/${requestId}/estimate/preview${completedQuery}`} replace />
  }

  const address = isLive
    ? liveQuote.request?.region
    : findContractorRequestDetail(requestId)?.property.address

  return (
    <ContractorMobileShell>
      <ContractorAppBar title="보낸 견적" />

      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          작성한 견적이 전송 완료 상태로 반영되었습니다.
        </p>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="견적 상태">
          <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-[11px] font-bold text-[#2563eb]">전송 완료</span>
          <button type="button" disabled aria-disabled="true" className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-bold text-[#64748b] disabled:opacity-50">사용자 확인 중</button>
          <button type="button" disabled aria-disabled="true" className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-bold text-[#64748b] disabled:opacity-50">견적 승인</button>
        </div>

        <ContractorSectionCard className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-[#2563eb]">{submission.estimateNumber}</p>
            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-bold text-[#2563eb]">전송 완료</span>
          </div>

          <p className="mt-3 text-xs text-[#64748b]">
            {address || '주소 미등록'} · {formatWon(calculateEstimateTotal(draft))}
          </p>

          <dl className="mt-3 space-y-2 border-t border-[#e2e8f0] pt-3">
            <ContractorEstimateInfoRow label="전송일">{submission.submittedDate.replace(/-/g, '.')}</ContractorEstimateInfoRow>
            <ContractorEstimateInfoRow label="유효일">{submission.validUntil.replace(/-/g, '.')}</ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>

        <Link to="/contractor/estimates" className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#1e293b]">
          보낸 견적 확인
        </Link>
      </main>
    </ContractorMobileShell>
  )
}
