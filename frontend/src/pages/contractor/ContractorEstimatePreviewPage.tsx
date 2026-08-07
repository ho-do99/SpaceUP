import {
  useCallback,
  useState,
} from 'react'
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import ContractorEstimateCostList from '@/components/contractor/ContractorEstimateCostList'
import ContractorEstimateHeader from '@/components/contractor/ContractorEstimateHeader'
import ContractorEstimateInfoRow from '@/components/contractor/ContractorEstimateInfoRow'
import ContractorEstimateSubmitDialog from '@/components/contractor/ContractorEstimateSubmitDialog'
import ContractorEstimateSummary from '@/components/contractor/ContractorEstimateSummary'
import {
  calculateAdditionalTotal,
  formatWon,
  isContractorEstimateValid,
} from '@/components/contractor/contractorEstimateUtils'
import ContractorMobileShell from '@/components/contractor/ContractorMobileShell'
import ContractorSectionCard from '@/components/contractor/ContractorSectionCard'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'

import ContractorRequestNotFound from './ContractorRequestNotFound'
import useContractorRequest from '@/hooks/useContractorRequest'
import { submitQuote } from '@/api/estimateApi'
import { getStoredQuoteId } from '@/utils/quoteDraft'

export default function ContractorEstimatePreviewPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const liveRequest = useContractorRequest(requestId)
  const request = /^\d+$/.test(requestId ?? '') ? liveRequest.request : findContractorRequestDetail(requestId)

  const {
    visitStatus,
    estimateDraft,
    estimateLifecycleStatus,
    submitEstimate,
    resubmitEstimate,
  } = useContractorPortalFlow()

  const isRevision =
    estimateLifecycleStatus ===
    'REVISION_REQUESTED'

  const isCompletedView =
    searchParams.get('mode') === 'completed'

  const completedQuery = isCompletedView
    ? '?mode=completed'
    : ''

  const [submitOpen, setSubmitOpen] =
    useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeSubmit = useCallback(
    () => setSubmitOpen(false),
    [],
  )

  if (!request) {
    return <ContractorRequestNotFound />
  }

  if (
    visitStatus !== 'COMPLETED' &&
    !isRevision &&
    !isCompletedView
  ) {
    return (
      <Navigate
        to={`/contractor/requests/${request.requestId}/visit`}
        replace
      />
    )
  }

  if (
    !estimateDraft ||
    !isContractorEstimateValid(
      estimateDraft,
    )
  ) {
    return (
      <Navigate
        to={`/contractor/requests/${request.requestId}/estimate${completedQuery}`}
        replace
      />
    )
  }

  const submit = async () => {
    if (requestId && /^\d+$/.test(requestId)) {
      const quoteId = getStoredQuoteId(Number(requestId))
      if (!quoteId) {
        setSubmitError('저장된 임시 견적을 찾을 수 없습니다. 이전 화면에서 먼저 저장해 주세요.')
        setSubmitOpen(false)
        return
      }
      setIsSubmitting(true)
      setSubmitError('')
      try { await submitQuote(quoteId) } catch (error) {
        setSubmitError(error instanceof Error ? error.message : '견적 제출에 실패했습니다.')
        setIsSubmitting(false)
        setSubmitOpen(false)
        return
      }
      setIsSubmitting(false)
    }
    if (isRevision) {
      resubmitEstimate(estimateDraft)
    } else {
      submitEstimate()
    }

    setSubmitOpen(false)

    if (isRevision) {
      navigate(
        '/contractor/estimates/SP-20260724-001',
      )
      return
    }

    navigate(
      `/contractor/requests/${request.requestId}/estimate/sent${completedQuery}`,
    )
  }

  return (
    <>
      <ContractorMobileShell innerClassName="h-dvh min-h-0">
        <ContractorEstimateHeader title="견적서 확인" />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-5">
          <h2 className="text-xl font-bold text-[#0f172a]">
            SpaceUP 견적서
          </h2>
          {submitError ? <p role="alert" className="mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">{submitError}</p> : null}

          <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
            견적번호 SP-20260724-001
            <br />
            작성일 2026.07.24 · 유효기간
            2026.08.07까지
          </p>

          <ContractorSectionCard
            className="mt-4"
            title="시공사 정보"
          >
            <dl className="space-y-2">
              <ContractorEstimateInfoRow label="시공사명">
                (주)스페이스 인테리어
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="사업자등록번호">
                123-45-67890
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="담당자명">
                김현수
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="연락처">
                010-1234-5678
              </ContractorEstimateInfoRow>
            </dl>
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="사용자 및 현장 정보"
          >
            <dl className="space-y-2">
              <ContractorEstimateInfoRow label="사용자명">
                {request.customerName}
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="현장 주소">
                {request.property.address}
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="주택 유형">
                {
                  request.property
                    .propertyType
                }
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="면적">
                {request.property.areaLabel}
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="현장방문일">
                2026.07.24
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="시공 예정일">
                {estimateDraft.condition.startDate.replace(
                  /-/g,
                  '.',
                )}
              </ContractorEstimateInfoRow>
            </dl>
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="실제 견적 항목 · 바닥재 · 벽지"
          >
            <div className="space-y-5">
              {estimateDraft.categories.map(
                (category) => (
                  <ContractorEstimateCostList
                    key={category.id}
                    category={category}
                  />
                ),
              )}
            </div>

            <p className="mt-4 rounded-lg bg-[#eff6ff] p-3 text-[11px] leading-5 text-[#2563eb]">
              사용자 선택: 바닥재 · 벽지 · 조명
              <br />
              조명은 현장 실측 후 별도 협의 · 현재
              견적 금액 미포함
            </p>
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="추가 비용"
          >
            <dl className="space-y-2">
              {estimateDraft.additionalCosts.map(
                (item) => (
                  <ContractorEstimateInfoRow
                    key={item.id}
                    label={item.label}
                  >
                    {formatWon(item.amount)}
                  </ContractorEstimateInfoRow>
                ),
              )}

              <ContractorEstimateInfoRow
                label="추가 비용 합계"
                emphasize
              >
                {formatWon(
                  calculateAdditionalTotal(
                    estimateDraft,
                  ),
                )}
              </ContractorEstimateInfoRow>
            </dl>
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="최종 금액 (VAT 포함)"
          >
            <ContractorEstimateSummary
              draft={estimateDraft}
              preview
            />
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="시공 조건"
          >
            <dl className="space-y-2">
              <ContractorEstimateInfoRow label="시공 예정일">
                {estimateDraft.condition.startDate.replace(
                  /-/g,
                  '.',
                )}
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="완료 예정일">
                {estimateDraft.condition.completionDate.replace(
                  /-/g,
                  '.',
                )}
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="예상 기간">
                {
                  estimateDraft.condition
                    .durationDays
                }
                일
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="결제 조건">
                계약금{' '}
                {
                  estimateDraft.condition
                    .paymentTerms
                    .depositPercent
                }
                % · 중도금{' '}
                {
                  estimateDraft.condition
                    .paymentTerms
                    .interimPercent
                }
                % · 잔금{' '}
                {
                  estimateDraft.condition
                    .paymentTerms
                    .balancePercent
                }
                %
              </ContractorEstimateInfoRow>

              <ContractorEstimateInfoRow label="A/S 기간">
                1년
              </ContractorEstimateInfoRow>
            </dl>
          </ContractorSectionCard>

          <ContractorSectionCard
            className="mt-4"
            title="특이사항"
          >
            <p className="whitespace-pre-line break-words text-xs leading-5 text-[#64748b]">
              {estimateDraft.notes ||
                '등록된 특이사항이 없습니다.'}
            </p>
          </ContractorSectionCard>
        </main>

        <div className="sticky bottom-0 z-20 grid h-20 shrink-0 grid-cols-2 gap-4 border-t border-[#e2e8f0] bg-white px-4 py-4">
          <Link
            to={`/contractor/requests/${request.requestId}/estimate${completedQuery}`}
            className="flex items-center justify-center rounded-[10px] border border-[#2563eb] text-sm font-bold text-[#2563eb]"
          >
            수정하기
          </Link>

          <button
            type="button"
            onClick={() =>
              setSubmitOpen(true)
            }
            className="rounded-[10px] bg-[#2563eb] text-sm font-bold text-white"
          >
            {isRevision
              ? '수정 견적 재전송'
              : '견적 제출하기'}
          </button>
        </div>
      </ContractorMobileShell>

      <ContractorEstimateSubmitDialog
        open={submitOpen}
        onClose={closeSubmit}
        onSubmit={() => { if (!isSubmitting) void submit() }}
        mode={
          isRevision
            ? 'resubmit'
            : 'submit'
        }
      />
    </>
  )
}
