import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import { acceptQuote } from '@/api/estimateApi'
import { formatWon } from '@/components/contractor/contractorEstimateUtils'
import { useEstimateRequestDetail } from '@/hooks/useEstimateRequests'
import type { EstimateRequestStatus } from '@/mocks/estimateRequests'

const statusClass: Record<EstimateRequestStatus, string> = {
  requested: 'bg-[#ecfdf5] text-[#059669]',
  reviewing: 'bg-[#fff7ed] text-[#d97706]',
}

interface InformationRowProps {
  label: string
  value: string
}

function InformationRow({ label, value }: InformationRowProps) {
  return (
    <div className="grid grid-cols-[95px_minmax(0,1fr)] gap-[15px]">
      <dt className="text-[9px] text-[#64748b]">{label}</dt>
      <dd className="break-keep text-[10px] font-bold leading-4 text-[#1e293b]">{value}</dd>
    </div>
  )
}

export default function EstimateRequestDetailPage() {
  const navigate = useNavigate()
  const { requestId } = useParams<{ requestId: string }>()
  const { request, quotes, usingLiveData, numericId } = useEstimateRequestDetail(requestId)
  const [acceptedQuoteId, setAcceptedQuoteId] = useState<number | null>(null)
  const [selectingQuoteId, setSelectingQuoteId] = useState<number | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)

  const selectedQuoteId = acceptedQuoteId ?? quotes.find((quote) => quote.status === 'ACCEPTED')?.id ?? null

  const selectQuote = async (quoteId: number) => {
    setSelectingQuoteId(quoteId)
    setSelectionError(null)
    try {
      await acceptQuote(quoteId)
      setAcceptedQuoteId(quoteId)
    } catch {
      setSelectionError('견적 선택에 실패했습니다. 이미 선택된 견적이 있는지 확인해주세요.')
    } finally {
      setSelectingQuoteId(null)
    }
  }

  if (!request) {
    return (
      <UserScreenShell className="h-dvh">
        <UserHeader variant="detail" title="견적 요청 상세" onBack={() => navigate('/mypage/requests')} />
        <main className="flex flex-1 flex-col items-center justify-center px-5 text-center" role="status">
          <h1 className="text-[18px] font-bold text-[#1e293b]">견적 요청 정보를 찾을 수 없습니다</h1>
          <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
            견적 요청 내역에서 정보를 다시 확인해주세요.
          </p>
          <Link
            to="/mypage/requests"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            요청 내역으로
          </Link>
        </main>
      </UserScreenShell>
    )
  }

  return (
    <UserScreenShell className="h-dvh">
      <UserHeader variant="detail" title="견적 요청 상세" onBack={() => navigate('/mypage/requests')} />

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-[18px]">
          <h1 className="text-[18px] font-bold leading-[22px] text-[#1e293b]">견적 요청 상세</h1>
          <p className="mt-2 text-[11px] text-[#64748b]">요청 내용과 진행 상태를 확인하세요. · {usingLiveData ? '실시간 정보' : '예시 정보'}</p>

          <section className="mt-[18px] rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[14px] font-bold leading-[17px] text-[#1e293b]">
                  {request.contractorName}
                </h2>
                <p className="mt-2 text-[10px] text-[#64748b]">{request.regionAndSpecialty}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-bold ${statusClass[request.status]}`}>
                {request.statusLabel}
              </span>
            </div>
            <dl className="mt-5 space-y-2">
              <InformationRow label="요청일" value={request.requestedAtLabel} />
              <InformationRow label="진행 단계" value={request.progressLabel} />
            </dl>
          </section>

          {usingLiveData ? (
            <section className="mt-3 rounded-[12px] border border-[#bfdbfe] bg-[#f8fbff] p-[13px]">
              <h2 className="text-[12px] font-bold text-[#1e293b]">도착한 견적 비교</h2>
              <p className="mt-1 text-[10px] leading-4 text-[#64748b]">시공사를 확정하기 전까지 각 업체와 개별 채팅하고 견적을 비교할 수 있습니다.</p>
              <div className="mt-3 space-y-2">
                {quotes.length ? quotes.map((quote) => {
                  const isSelected = selectedQuoteId === quote.id
                  const canSelect = quote.status === 'SUBMITTED' && selectedQuoteId === null
                  return (
                    <article key={quote.id} className={`rounded-lg border p-3 ${isSelected ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#e2e8f0] bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-[11px] font-bold text-[#1e293b]">{quote.contractorName ?? `시공사 #${quote.contractorId}`}</h3>
                          <p className="mt-1 text-[10px] text-[#64748b]">{quote.title || '제안 견적'} · {quote.durationDays ? `${quote.durationDays}일 예상` : '기간 협의'}</p>
                        </div>
                        <strong className="shrink-0 text-[12px] text-[#2563eb]">{formatWon(quote.totalAmount ?? 0)}</strong>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link to={`/mypage/requests/${numericId}/chat/${quote.contractorId}`} className="flex h-9 items-center justify-center rounded-md border border-[#2563eb] bg-white text-[10px] font-bold text-[#2563eb]">채팅하기</Link>
                        <button type="button" disabled={!canSelect || selectingQuoteId !== null} onClick={() => void selectQuote(quote.id)} className="h-9 rounded-md bg-[#2563eb] text-[10px] font-bold text-white disabled:bg-[#cbd5e1]">
                          {isSelected ? '최종 선택됨' : selectingQuoteId === quote.id ? '선택 중...' : quote.status === 'SUBMITTED' ? '이 시공사 선택' : quote.status ?? '확인 중'}
                        </button>
                      </div>
                    </article>
                  )
                }) : <p className="rounded-lg bg-white px-3 py-4 text-center text-[10px] text-[#64748b]">아직 도착한 견적이 없습니다.</p>}
              </div>
              {selectionError ? <p role="alert" className="mt-3 text-[10px] font-bold text-[#dc2626]">{selectionError}</p> : null}
            </section>
          ) : null}

          <section className="mt-3 rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">요청 정보</h2>
            <dl className="mt-4 space-y-[13px]">
              <InformationRow label="요청 항목" value={request.itemCountLabel} />
              <InformationRow label="예산" value={request.budgetLabel} />
              <InformationRow label="희망 일정" value={request.preferredDateLabel} />
              <InformationRow label="요청 사항" value={request.requestMessage} />
            </dl>
          </section>

          <section className="mt-3 min-h-[112px] rounded-[12px] border border-[#e2e8f0] bg-white p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">선택 항목</h2>
            <ul className="mt-4 flex flex-wrap gap-[22px]">
              {request.selectedItems.map((item) => (
                <li key={item} className="rounded-full bg-[#eff6ff] px-3 py-2 text-[9px] font-bold text-[#2563eb]">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-3 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-[13px]">
            <h2 className="text-[12px] font-bold text-[#1e293b]">시공사 정보</h2>
            <dl className="mt-4 space-y-[13px]">
              <InformationRow label="업체명" value={request.contractorName} />
              <InformationRow label="답변 상태" value={request.responseStatusLabel} />
            </dl>
          </section>
        </main>

        <footer className="shrink-0 bg-white px-[15px] pb-[calc(19px+env(safe-area-inset-bottom))]">
          <Link
            to="/mypage/requests"
            className="flex h-12 w-full items-center justify-center rounded-[5px] bg-[#2563eb] text-[12px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
          >
            목록으로
          </Link>
        </footer>
      </div>
    </UserScreenShell>
  )
}
