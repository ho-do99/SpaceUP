import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { acceptQuote, getQuote, requestQuoteRevision } from '@/api/estimateApi'
import { getRequest } from '@/api/requestApi'
import UserHeader from '@/components/user/UserHeader'
import UserScreenShell from '@/components/user/UserScreenShell'
import type { QuoteItemInput, QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

interface AgreementState {
  amountChecked: boolean
  scheduleChecked: boolean
  additionalCostChecked: boolean
}

function EstimateSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
      <h2 className="text-[15px] font-bold leading-[23px] text-[#0f172a]">{title}</h2>
      <div className="mt-2 text-[12px] leading-[18px] text-[#64748b]">{children}</div>
    </section>
  )
}

function InformationRow({ label, value, strong = false, blue = false }: {
  label: string
  value: string
  strong?: boolean
  blue?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[#64748b]">{label}</span>
      <span className={`text-right ${strong ? 'font-bold' : 'font-normal'} ${blue ? 'text-[#2563eb]' : 'text-[#334155]'}`}>
        {value}
      </span>
    </div>
  )
}

const formatWon = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
const formatDate = (value?: string | null) => value ? value.slice(0, 10).replace(/-/g, '.') : '-'
const itemTotal = (items: QuoteItemInput[]) => items.reduce((sum, item) => sum + item.amount, 0)

function isCategory(item: QuoteItemInput, category: string) {
  return item.category === category || item.category.startsWith(`${category}-`)
}

function CategoryEstimate({ category, items }: { category: string; items: QuoteItemInput[] }) {
  if (!items.length) return null
  return (
    <EstimateSection title={`${category} 견적`}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.category}-${item.description ?? ''}-${index}`} className="border-b border-[#e2e8f0] pb-3 last:border-b-0 last:pb-0">
            <p className="font-medium text-[#334155]">{item.description || category}</p>
            {item.quantity != null ? (
              <p className="mt-1">
                {item.quantity.toLocaleString('ko-KR')}{item.measurementUnit || ''}
                {item.unitPrice != null ? ` × ${formatWon(item.unitPrice)}` : ''}
              </p>
            ) : null}
            <InformationRow label="항목 금액" value={formatWon(item.amount)} strong blue />
          </div>
        ))}
      </div>
      <div className="my-4 border-t border-[#e2e8f0]" />
      <InformationRow label={`${category} 합계`} value={formatWon(itemTotal(items))} strong blue />
    </EstimateSection>
  )
}

export default function EstimatePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const quoteRouteId = id && /^\d+$/.test(id) ? Number(id) : null

  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [request, setRequest] = useState<RequestResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [agreements, setAgreements] = useState<AgreementState>({
    amountChecked: false,
    scheduleChecked: false,
    additionalCostChecked: false,
  })
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [revisionError, setRevisionError] = useState('')
  const [revisionSubmitting, setRevisionSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    setQuote(null)
    setRequest(null)
    setLoadError('')
    setLoading(true)
    if (!quoteRouteId) {
      setLoadError('올바른 견적 번호가 아닙니다.')
      setLoading(false)
      return () => { active = false }
    }

    void getQuote(quoteRouteId)
      .then(async (loadedQuote) => ({ loadedQuote, loadedRequest: await getRequest(loadedQuote.requestId) }))
      .then(({ loadedQuote, loadedRequest }) => {
        if (!active) return
        setQuote(loadedQuote)
        setRequest(loadedRequest)
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : '견적 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [quoteRouteId])

  const canApprove = useMemo(() => Boolean(
    quote?.status === 'SUBMITTED' &&
    agreements.amountChecked &&
    agreements.scheduleChecked &&
    agreements.additionalCostChecked &&
    !processing,
  ), [agreements, processing, quote?.status])

  if (loading) {
    return <UserScreenShell className="h-dvh"><UserHeader variant="detail" title="받은 견적서" onBack={() => navigate('/mypage/requests')} /><main className="flex flex-1 items-center justify-center text-sm text-[#64748b]">견적을 불러오는 중입니다.</main></UserScreenShell>
  }

  if (loadError || !quote || !request) {
    return <UserScreenShell className="h-dvh"><UserHeader variant="detail" title="받은 견적서" onBack={() => navigate('/mypage/requests')} /><main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"><p role="alert" className="text-sm font-bold text-[#dc2626]">{loadError || '견적 정보를 찾을 수 없습니다.'}</p><button type="button" onClick={() => navigate('/mypage/requests')} className="h-11 rounded-lg bg-[#2563eb] px-6 text-xs font-bold text-white">견적 요청 내역으로</button></main></UserScreenShell>
  }

  const floorItems = quote.items.filter((item) => isCategory(item, '바닥재'))
  const wallpaperItems = quote.items.filter((item) => isCategory(item, '벽지'))
  const lightingItems = quote.items.filter((item) => isCategory(item, '조명'))
  const additionalItems = quote.items.filter((item) => item.category === '추가비용')
  const calculatedMaterialCost = itemTotal([...floorItems, ...wallpaperItems, ...lightingItems])
  const calculatedAdditionalCost = itemTotal(additionalItems)
  const materialCost = quote.materialCost ?? calculatedMaterialCost
  const additionalCost = quote.laborCost ?? calculatedAdditionalCost
  const supplyAmount = materialCost + additionalCost
  const discount = quote.discount ?? 0
  const vat = quote.vat ?? Math.max(0, quote.totalAmount - supplyAmount + discount)
  const calculatedTotal = supplyAmount + vat - discount
  const amountsConsistent = calculatedTotal === quote.totalAmount

  const approveEstimate = async () => {
    if (!canApprove || processing) return
    setProcessing(true)
    setActionMessage('')
    try {
      await acceptQuote(quote.id)
      setQuote((current) => current ? { ...current, status: 'ACCEPTED' } : current)
      setActionMessage('견적 승인이 완료되었습니다.')
      window.setTimeout(() => navigate(`/mypage/requests/${quote.requestId}`), 900)
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : '견적 승인에 실패했습니다.')
      setProcessing(false)
    }
  }

  const submitRevisionRequest = async () => {
    const note = revisionNote.trim()
    if (!note || revisionSubmitting || quote.status !== 'SUBMITTED') return
    setRevisionSubmitting(true)
    setRevisionError('')
    try {
      await requestQuoteRevision(quote.id, { note })
      setRevisionModalOpen(false)
      setRevisionNote('')
      setActionMessage('견적 수정 요청을 보냈습니다.')
    } catch (error) {
      setRevisionError(error instanceof Error ? error.message : '견적 수정 요청에 실패했습니다.')
    } finally {
      setRevisionSubmitting(false)
    }
  }

  return (
    <UserScreenShell className="h-dvh bg-[#f8fafc]">
      <UserHeader variant="detail" title="받은 견적서" onBack={() => navigate(`/mypage/requests/${quote.requestId}`)} />

      {actionMessage ? (
        <div className="absolute left-4 right-4 top-[70px] z-50">
          <p role="status" className="mx-auto max-w-[361px] rounded-[12px] border border-[#bfdbfe] bg-white px-4 py-3 text-[12px] font-bold text-[#1e293b] shadow-lg">{actionMessage}</p>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 pb-[120px] pt-5">
          <div className="space-y-4">
            <section className="rounded-[12px] bg-[#eff6ff] px-4 py-[14px]">
              <h1 className="text-[13px] font-bold text-[#2563eb]">{quote.status === 'ACCEPTED' ? '견적 승인 완료' : '견적 도착'}</h1>
              <p className="mt-2 text-[11px] leading-[17px] text-[#64748b]">시공사가 서버로 전송한 실측 견적과 계산 결과입니다.</p>
            </section>

            <EstimateSection title="받은 견적서">
              <div className="space-y-2">
                <InformationRow label="견적번호" value={`#${quote.id}`} />
                <InformationRow label="작성일" value={formatDate(quote.createdAt)} />
                <InformationRow label="유효기간" value={formatDate(quote.validUntil)} />
                <InformationRow label="견적 단계" value={quote.phase === 'FINAL' ? '실측 최종 견적' : '1차 예상 견적'} strong />
              </div>
            </EstimateSection>

            <EstimateSection title="견적을 보낸 시공사">
              <p className="font-medium text-[#334155]">{quote.contractorName}</p>
              <p className="mt-1">의뢰 {request.requestCode ?? `REQ-ID-${request.id}`}</p>
              <button type="button" onClick={() => navigate(`/mypage/requests/${quote.requestId}/chat/${quote.contractorId}`)} className="mt-4 h-11 w-full rounded-[10px] border border-[#2563eb] bg-white text-[13px] font-bold text-[#2563eb]">시공사에 문의하기</button>
            </EstimateSection>

            <EstimateSection title="현장 실측 정보">
              <div className="space-y-2">
                <InformationRow label="고객" value={request.landlordName || '사용자'} />
                <InformationRow label="주소" value={request.region} />
                <InformationRow label="주택 정보" value={`${request.propertyType} · ${request.areaM2}㎡`} />
                <InformationRow label="바닥 실측" value={`${quote.floorAreaM2 ?? 0}㎡`} />
                <InformationRow label="벽지 실측" value={`${quote.wallpaperAreaM2 ?? 0}㎡`} />
                <InformationRow label="조명 실측" value={`${quote.lightingQuantity ?? 0}개`} />
              </div>
            </EstimateSection>

            <CategoryEstimate category="바닥재" items={floorItems} />
            <CategoryEstimate category="벽지" items={wallpaperItems} />
            <CategoryEstimate category="조명" items={lightingItems} />

            <EstimateSection title="추가 비용">
              <div className="space-y-2">
                {additionalItems.length ? additionalItems.map((item, index) => (
                  <InformationRow key={`${item.description ?? '추가비용'}-${index}`} label={item.description || `추가 비용 ${index + 1}`} value={formatWon(item.amount)} />
                )) : <p>등록된 추가 비용이 없습니다.</p>}
              </div>
              <div className="my-4 border-t border-[#e2e8f0]" />
              <InformationRow label="추가 비용 합계" value={formatWon(additionalCost)} strong blue />
            </EstimateSection>

            <EstimateSection title="최종 금액 (VAT 포함)">
              <div className="space-y-2">
                <InformationRow label="자재 시공 항목" value={formatWon(materialCost)} />
                <InformationRow label="추가 비용" value={formatWon(additionalCost)} />
                <InformationRow label="공급가액" value={formatWon(supplyAmount)} strong />
                <InformationRow label="부가세" value={formatWon(vat)} />
                {discount > 0 ? <InformationRow label="할인" value={`-${formatWon(discount)}`} /> : null}
              </div>
              <div className="my-4 border-t border-[#e2e8f0]" />
              <InformationRow label="최종 견적 금액" value={formatWon(quote.totalAmount)} strong blue />
              {!amountsConsistent ? <p role="alert" className="mt-3 text-[11px] font-bold text-[#dc2626]">저장된 견적 합계가 세부 항목과 일치하지 않습니다. 시공사에 수정을 요청해 주세요.</p> : null}
            </EstimateSection>

            <EstimateSection title="시공 조건">
              <div className="space-y-2">
                <InformationRow label="시작 예정일" value={formatDate(quote.startDate)} />
                <InformationRow label="예상 기간" value={quote.durationDays ? `${quote.durationDays}일` : '협의'} />
                <InformationRow label="현장 상태" value={quote.siteCondition || '별도 기록 없음'} />
              </div>
              {quote.detailContent ? <p className="mt-4 border-t border-[#e2e8f0] pt-3 leading-5">{quote.detailContent}</p> : null}
            </EstimateSection>

            {quote.status === 'SUBMITTED' ? (
              <EstimateSection title="견적 승인 전 확인">
                <div className="space-y-1">
                  {([
                    ['amountChecked', '견적 금액과 세부 항목을 확인했습니다.'],
                    ['scheduleChecked', '시공 일정과 조건을 확인했습니다.'],
                    ['additionalCostChecked', '추가 비용을 확인했습니다.'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3">
                      <input type="checkbox" checked={agreements[key]} onChange={(event) => setAgreements((current) => ({ ...current, [key]: event.target.checked }))} className="size-5 accent-[#2563eb]" />
                      <span className="text-[12px] text-[#0f172a]">{label}</span>
                    </label>
                  ))}
                </div>
              </EstimateSection>
            ) : null}
          </div>
        </main>

        {quote.status === 'SUBMITTED' ? (
          <footer className="shrink-0 border-t border-[#e2e8f0] bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-[15px]">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={processing} onClick={() => setRevisionModalOpen(true)} className="h-12 rounded-[10px] border border-[#2563eb] bg-white text-[13px] font-bold text-[#2563eb] disabled:opacity-50">수정 요청</button>
              <button type="button" disabled={!canApprove} onClick={() => { void approveEstimate() }} className="h-12 rounded-[10px] bg-[#2563eb] text-[13px] font-bold text-white disabled:bg-[#93b4f5]">{processing ? '처리 중...' : '견적 승인'}</button>
            </div>
          </footer>
        ) : null}
      </div>

      {revisionModalOpen ? (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/40 px-6" role="dialog" aria-modal="true" aria-labelledby="quote-revision-title">
          <div className="w-full max-w-[345px] rounded-[16px] bg-white p-5 shadow-xl">
            <h2 id="quote-revision-title" className="text-[17px] font-bold text-[#0f172a]">견적 수정 요청</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#64748b]">수정이 필요한 내용을 시공사에 전달해 주세요.</p>
            <label htmlFor="quote-revision-note" className="mt-4 block text-[11px] font-bold text-[#1e293b]">수정 요청 내용</label>
            <textarea id="quote-revision-note" value={revisionNote} onChange={(event) => { setRevisionNote(event.target.value); setRevisionError('') }} placeholder="수정이 필요한 항목이나 내용을 입력해 주세요." className="mt-2 min-h-[120px] w-full resize-none rounded-[10px] border border-[#e2e8f0] p-3 text-[12px] outline-none focus:border-[#2563eb]" />
            {revisionError ? <p role="alert" className="mt-2 text-[11px] font-semibold text-[#dc2626]">{revisionError}</p> : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" disabled={revisionSubmitting} onClick={() => { setRevisionModalOpen(false); setRevisionError('') }} className="h-11 rounded-[8px] border border-[#cbd5e1] text-[12px] font-bold text-[#475569]">취소</button>
              <button type="button" disabled={!revisionNote.trim() || revisionSubmitting} onClick={() => { void submitRevisionRequest() }} className="h-11 rounded-[8px] bg-[#2563eb] text-[12px] font-bold text-white disabled:bg-[#93b4f5]">{revisionSubmitting ? '요청 중...' : '수정 요청하기'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </UserScreenShell>
  )
}
