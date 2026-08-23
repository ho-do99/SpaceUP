import { useEffect, useState } from 'react'
import {
  Link,
  Navigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { getQuotesByRequest } from '@/api/estimateApi'
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
  const numericRequestId = isLive && requestId ? Number(requestId) : null
  const storedQuoteId = numericRequestId ? getStoredQuoteId(numericRequestId) : null
  const [quoteId, setQuoteId] = useState<number | null>(storedQuoteId)
  const [quoteLookup, setQuoteLookup] = useState({
    loading: Boolean(numericRequestId && !storedQuoteId),
    error: '',
  })
  const liveQuote = useContractorQuote(quoteId ? String(quoteId) : undefined)

  useEffect(() => {
    if (!numericRequestId) {
      setQuoteId(null)
      setQuoteLookup({ loading: false, error: '' })
      return
    }

    let active = true
    setQuoteId(storedQuoteId)
    setQuoteLookup({ loading: !storedQuoteId, error: '' })

    void getQuotesByRequest(numericRequestId)
      .then((quotes) => {
        if (!active) return

        const submittedQuotes = quotes
          .filter((quote) => quote.status !== 'DRAFT')
          .sort((left, right) => {
            const leftCreatedAt = left.createdAt
              ? Date.parse(left.createdAt)
              : 0
            const rightCreatedAt = right.createdAt
              ? Date.parse(right.createdAt)
              : 0
            const dateDifference =
              (Number.isNaN(rightCreatedAt) ? 0 : rightCreatedAt) -
              (Number.isNaN(leftCreatedAt) ? 0 : leftCreatedAt)

            return dateDifference === 0
              ? right.id - left.id
              : dateDifference
          })
        const storedQuote = submittedQuotes.find(
          (quote) => quote.id === storedQuoteId,
        )

        setQuoteId((storedQuote ?? submittedQuotes[0])?.id ?? null)
        setQuoteLookup({ loading: false, error: '' })
      })
      .catch((reason: unknown) => {
        if (!active) return

        setQuoteLookup({
          loading: false,
          error: storedQuoteId
            ? ''
            : reason instanceof Error
              ? reason.message
              : '전송한 견적을 불러오지 못했습니다.',
        })
      })

    return () => {
      active = false
    }
  }, [numericRequestId, storedQuoteId])

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

  if (isLive && (quoteLookup.loading || (quoteId && liveQuote.loading))) {
    return <ContractorMobileShell><main className="flex min-h-dvh items-center justify-center text-sm text-[#64748b]">보낸 견적을 불러오는 중입니다.</main></ContractorMobileShell>
  }

  if (isLive && (!quoteId || quoteLookup.error || liveQuote.error)) {
    return (
      <ContractorMobileShell>
        <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[#64748b]">
          <p role="alert">{quoteLookup.error || liveQuote.error || '전송한 견적을 찾을 수 없습니다.'}</p>
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
