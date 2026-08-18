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
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'

export default function ContractorEstimateSentPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()

  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)

  const {
    estimateDraft,
    estimateStatus,
    estimateSubmission,
  } = useContractorPortalFlow()

  const isCompletedView =
    searchParams.get('mode') === 'completed'

  const completedQuery = isCompletedView
    ? '?mode=completed'
    : ''

  if (!request) {
    return <ContractorRequestNotFound />
  }


  if (!estimateDraft) {
    return (
      <Navigate
        to={`/contractor/requests/${request.requestId}/estimate${completedQuery}`}
        replace
      />
    )
  }

  if (
    estimateStatus !== 'SUBMITTED' ||
    !estimateSubmission
  ) {
    return (
      <Navigate
        to={`/contractor/requests/${request.requestId}/estimate/preview${completedQuery}`}
        replace
      />
    )
  }

  return (
    <ContractorMobileShell>
      <ContractorAppBar
        title="보낸 견적"
      />

      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <p className="text-xs leading-5 text-[#64748b]">
          작성한 견적이 전송 완료 상태로
          반영되었습니다.
        </p>

        <div
          className="mt-4 flex flex-wrap gap-2"
          aria-label="견적 상태"
        >
          <span className="rounded-full bg-[#eff6ff] px-4 py-2 text-[11px] font-bold text-[#2563eb]">
            전송 완료
          </span>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-bold text-[#64748b] disabled:opacity-50"
          >
            사용자 확인 중
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-[11px] font-bold text-[#64748b] disabled:opacity-50"
          >
            견적 승인
          </button>
        </div>

        <ContractorSectionCard className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-bold text-[#2563eb]">
              {
                estimateSubmission
                  .estimateNumber
              }
            </p>

            <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-[10px] font-bold text-[#2563eb]">
              전송 완료
            </span>
          </div>

          <p className="mt-3 text-xs text-[#64748b]">
            {request.property.address} ·{' '}
            {formatWon(
              calculateEstimateTotal(
                estimateDraft,
              ),
            )}
          </p>

          <dl className="mt-3 space-y-2 border-t border-[#e2e8f0] pt-3">
            <ContractorEstimateInfoRow label="전송일">
              {estimateSubmission.submittedDate.replace(
                /-/g,
                '.',
              )}
            </ContractorEstimateInfoRow>

            <ContractorEstimateInfoRow label="유효일">
              {estimateSubmission.validUntil.replace(
                /-/g,
                '.',
              )}
            </ContractorEstimateInfoRow>
          </dl>
        </ContractorSectionCard>

        <Link
          to="/contractor/estimates"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#1e293b]"
        >
          보낸 견적 확인
        </Link>
      </main>
    </ContractorMobileShell>
  )
}
