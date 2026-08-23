import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { useEstimateRequestDetail } from '@/hooks/useEstimateRequests'
import type { EstimateRequestStatus } from '@/mocks/estimateRequests'

const statusClass: Record<
  EstimateRequestStatus,
  string
> = {
  requested: 'bg-[#ecfdf5] text-[#059669]',
  reviewing: 'bg-[#fff7ed] text-[#d97706]',
}

interface InformationRowProps {
  label: string
  value: string
  valueClassName?: string
}

function InformationRow({
  label,
  value,
  valueClassName = '',
}: InformationRowProps) {
  return (
    <div className="grid grid-cols-[105px_minmax(0,1fr)] gap-3">
      <dt className="text-[10px] leading-[17px] text-[#64748b]">
        {label}
      </dt>

      <dd
        className={`min-w-0 break-keep text-[10px] font-bold leading-[17px] text-[#1e293b] ${valueClassName}`}
      >
        {value}
      </dd>
    </div>
  )
}

function displayQuoteTitle(title?: string | null) {
  const normalized = title?.replace(/^의뢰\s+#?\d+\s*/u, '').trim()
  return normalized || '제안 견적'
}

function ProgressIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#2563EB"
        strokeWidth="1.8"
      />

      <path
        d="M8 12L10.7 14.7L16 9.5"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function EstimateRequestDetailPage() {
  const navigate = useNavigate()

  const { requestId } =
    useParams<{
      requestId: string
    }>()

  const {
    request,
    quotes,
    usingLiveData,
    numericId,
    loading,
    error,
  } = useEstimateRequestDetail(requestId)

  if (loading || error) {
    return <UserScreenShell className="h-dvh"><UserHeader variant="detail" title="견적 요청 상세" onBack={() => navigate('/mypage/requests')} /><main className="flex flex-1 items-center justify-center px-6 text-center"><p role={error ? 'alert' : 'status'} className={`text-[13px] ${error ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>{error || '견적 요청 정보를 불러오는 중입니다.'}</p></main></UserScreenShell>
  }

  if (!request) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader
          variant="detail"
          title="견적 요청 상세"
          onBack={() =>
            navigate('/mypage/requests')
          }
        />

        <div className="flex min-h-0 flex-1 flex-col">
          <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[18px] font-bold text-[#1e293b]">
              견적 요청 정보를 찾을 수 없습니다
            </h1>

            <p className="mt-2 text-[11px] leading-5 text-[#64748b]">
              견적 요청 내역에서 정보를 다시 확인해주세요.
            </p>
          </main>

          <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
            <Link
              to="/mypage/requests"
              className="flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white"
            >
              요청 내역으로
            </Link>
          </footer>
        </div>
      </UserScreenShell>
    )
  }

  const visibleQuotes = quotes.filter(
    (quote) => quote.status !== 'DRAFT',
  )
  const acceptedFinalQuote = visibleQuotes.find(
    (quote) =>
      quote.status === 'ACCEPTED' &&
      quote.phase === 'FINAL',
  )
  const acceptedPreliminaryQuote = visibleQuotes.find(
    (quote) =>
      quote.status === 'ACCEPTED' &&
      quote.phase === 'PRELIMINARY',
  )
  const acceptedQuote =
    acceptedFinalQuote ?? acceptedPreliminaryQuote
  const nextStepRoute = acceptedFinalQuote
    ? `/estimate/${acceptedFinalQuote.id}?step=payment`
    : acceptedPreliminaryQuote
      ? `/mypage/requests/${requestId}/visit/${acceptedPreliminaryQuote.contractorId}`
      : null
  const nextStepLabel = acceptedFinalQuote
    ? '결제 단계 확인'
    : '방문 일정 확인'
  const acceptedPhaseLabel = acceptedFinalQuote
    ? '실측 최종 견적'
    : '1차 예상 견적'
  const acceptedProgressTitle = acceptedFinalQuote
    ? '최종 견적 승인 완료 · 결제 준비'
    : '1차 견적 승인 완료 · 현장 방문 준비'
  const acceptedProgressDescription = acceptedFinalQuote
    ? '승인한 최종 견적을 기준으로 결제 단계를 확인해 주세요.'
    : '선택한 시공사와 현장 방문 일정을 확인해 주세요.'
  const displayContractorName =
    acceptedQuote?.contractorName ?? request.contractorName

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader
        variant="detail"
        title="견적 요청 상세"
        onBack={() =>
          navigate('/mypage/requests')
        }
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-[18px]">
          <h1 className="text-[18px] font-bold leading-[24px] text-[#1e293b]">
            견적 요청 상세
          </h1>

          <p className="mt-[6px] text-[11px] leading-[17px] text-[#64748b]">
            요청 내용과 진행 상태를 확인하세요.
          </p>

          {acceptedQuote && nextStepRoute ? (
            <section className="mt-4 rounded-[12px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
              <div className="flex items-start gap-2">
                <ProgressIcon />

                <div className="min-w-0 flex-1">
                  <h2 className="text-[13px] font-bold leading-5 text-[#2563eb]">
                    {acceptedProgressTitle}
                  </h2>

                  <p className="mt-1 text-[10px] leading-[17px] text-[#64748b]">
                    {acceptedProgressDescription}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-[8px] bg-white px-3 py-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#64748b]">
                    승인 견적
                  </span>

                  <strong className="text-[#2563eb]">
                    {formatWon(acceptedQuote.totalAmount ?? 0)}
                  </strong>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-[#64748b]">
                    견적 단계
                  </span>

                  <strong className="text-[#1e293b]">
                    {acceptedPhaseLabel}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(nextStepRoute)
                }
                className="mt-3 h-11 w-full rounded-[8px] bg-[#2563eb] text-[12px] font-bold text-white"
              >
                {nextStepLabel}
              </button>
            </section>
          ) : null}

          <section className="mt-4 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold leading-[18px] text-[#1e293b]">
                  {displayContractorName}
                </h2>

                <p className="mt-[7px] text-[10px] leading-[16px] text-[#64748b]">
                  {request.regionAndSpecialty}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold ${statusClass[request.status]}`}
              >
                {acceptedQuote
                  ? '견적 승인'
                  : request.statusLabel}
              </span>
            </div>

            <dl className="mt-5 space-y-2">
              <InformationRow
                label="요청일"
                value={request.requestedAtLabel}
              />

              <InformationRow
                label="진행 단계"
                value={
                  acceptedQuote
                    ? acceptedProgressTitle
                    : request.progressLabel
                }
              />
            </dl>
          </section>

          {usingLiveData &&
          !acceptedQuote ? (
            <section className="mt-3 rounded-[12px] border border-[#bfdbfe] bg-[#f8fbff] p-[13px]">
              <h2 className="text-[12px] font-bold text-[#1e293b]">
                도착한 견적 비교
              </h2>

              <p className="mt-1 text-[10px] leading-4 text-[#64748b]">
                시공사를 확정하기 전까지 각 업체와
                개별 채팅하고 견적을 비교할 수 있습니다.
              </p>

              <div className="mt-3 space-y-2">
                {visibleQuotes.length ? (
                  visibleQuotes.map((quote) => {
                    return (
                      <article
                        key={quote.id}
                        className="rounded-lg border border-[#e2e8f0] bg-white p-3"
                      >
                        <Link to={`/estimate/${quote.id}`} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-[11px] font-bold text-[#1e293b]">
                              {quote.contractorName || `시공사 ID-${quote.contractorId}`}
                            </h3>

                            <p className="mt-1 text-[9px] font-medium text-[#2563eb]">
                              의뢰 {request.requestCode ?? `REQ-ID-${numericId}`} · 견적 ID-{quote.id}
                            </p>

                            <p className="mt-1 text-[10px] text-[#64748b]">
                              {displayQuoteTitle(quote.title)}
                              {' · '}
                              {quote.durationDays
                                ? `${quote.durationDays}일 예상`
                                : '기간 협의'}
                            </p>
                          </div>

                          <strong className="shrink-0 text-[12px] text-[#2563eb]">
                            {formatWon(
                              quote.totalAmount ??
                                0,
                            )}
                          </strong>
                        </Link>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Link
                            to={`/mypage/requests/${numericId}/chat/${quote.contractorId}`}
                            className="flex h-9 items-center justify-center rounded-md border border-[#2563eb] bg-white text-[10px] font-bold text-[#2563eb]"
                          >
                            채팅하기
                          </Link>

                          <Link
                            to={`/estimate/${quote.id}`}
                            className="flex h-9 items-center justify-center rounded-md bg-[#2563eb] text-[10px] font-bold text-white"
                          >
                            견적서 확인하기
                          </Link>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <p className="rounded-lg bg-white px-3 py-4 text-center text-[10px] text-[#64748b]">
                    아직 도착한 견적이 없습니다.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          <section className="mt-3 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">
              요청 정보
            </h2>

            <dl className="mt-4 space-y-[13px]">
              <InformationRow
                label="요청 항목"
                value={request.itemCountLabel}
              />

              <InformationRow
                label="예산"
                value={request.budgetLabel}
              />

              <InformationRow
                label="희망 일정"
                value={request.preferredDateLabel}
              />

              <InformationRow
                label="요청 사항"
                value={request.requestMessage}
                valueClassName="font-normal"
              />
            </dl>
          </section>

          <section className="mt-3 min-h-[112px] rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">
              선택 항목
            </h2>

            <ul className="mt-4 flex flex-wrap gap-[22px]">
              {request.selectedItems.map(
                (item) => (
                  <li
                    key={item}
                    className="rounded-full bg-[#eff6ff] px-3 py-2 text-[9px] font-bold text-[#2563eb]"
                  >
                    {item}
                  </li>
                ),
              )}
            </ul>
          </section>

          <section className="mt-3 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">
              시공사 정보
            </h2>

            <dl className="mt-4 space-y-[13px]">
              <InformationRow
                label="업체명"
                value={displayContractorName}
              />

              <InformationRow
                label="답변 상태"
                value={
                  acceptedQuote
                    ? '견적 승인 완료'
                    : request.responseStatusLabel
                }
              />
            </dl>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          {acceptedQuote && nextStepRoute ? (
            <button
              type="button"
              onClick={() =>
                navigate(nextStepRoute)
              }
              className="h-12 w-full rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white"
            >
              {nextStepLabel}
            </button>
          ) : (
            <Link
              to="/mypage/requests"
              className="flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white"
            >
              목록으로
            </Link>
          )}
        </footer>
      </div>
    </UserScreenShell>
  )
}
