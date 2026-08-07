import { useEffect, useMemo, useState } from 'react'
import { getMyEstimateRequests, getRequest } from '@/api/requestApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import { estimateRequests, getEstimateRequestById, type EstimateRequestSummary } from '@/mocks/estimateRequests'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

const won = new Intl.NumberFormat('ko-KR')

function requestStatus(status?: string) {
  if (status === 'NEW') return { status: 'requested' as const, label: '요청 완료', progress: '시공사 참여 요청 전' }
  if (status === 'REVIEWING') return { status: 'reviewing' as const, label: '검토 중', progress: '여러 시공사 참여 확인 중' }
  if (status === 'QUOTE_REQUESTED') return { status: 'reviewing' as const, label: '견적 비교', progress: '시공사 견적 접수 중' }
  if (status === 'APPROVED') return { status: 'requested' as const, label: '시공사 확정', progress: '최종 시공사 선택 완료' }
  if (status === 'IN_PROGRESS') return { status: 'reviewing' as const, label: '시공 중', progress: '시공 진행 중' }
  if (status === 'COMPLETED') return { status: 'requested' as const, label: '완료', progress: '시공 완료' }
  return { status: 'reviewing' as const, label: status ?? '확인 필요', progress: '진행 상태 확인 필요' }
}

export function toEstimateRequestSummary(request: RequestResponse): EstimateRequestSummary {
  const selectedItems = request.requestedItems?.split(',').map((item) => item.trim()).filter(Boolean) ?? []
  const state = requestStatus(request.status)
  const budget = request.budgetMax ?? request.budget ?? request.budgetMin
  return {
    id: String(request.id),
    contractorId: request.contractorId ? String(request.contractorId) : '',
    contractorName: request.contractorId ? `선택 시공사 #${request.contractorId}` : '여러 시공사 견적 비교',
    regionAndSpecialty: `${request.region} · ${request.requestCode ?? `의뢰 #${request.id}`}`,
    requestedAtLabel: request.createdAt?.slice(0, 10) ?? '-',
    itemCountLabel: `${selectedItems.length}개 항목`,
    status: state.status,
    statusLabel: state.label,
    progressLabel: state.progress,
    budgetLabel: budget ? `${won.format(budget)}원` : '예산 협의',
    preferredDateLabel: request.desiredDate || '미정',
    requestMessage: request.requestedItems || '등록된 요청 사항이 없습니다.',
    selectedItems,
    responseStatusLabel: state.progress,
  }
}

export function useEstimateRequestHistory() {
  const [requests, setRequests] = useState<readonly EstimateRequestSummary[]>(estimateRequests)
  const [usingLiveData, setUsingLiveData] = useState(false)

  useEffect(() => {
    let active = true
    getMyEstimateRequests({ size: 100 })
      .then((page) => {
        if (!active) return
        setRequests(page.content.map(toEstimateRequestSummary))
        setUsingLiveData(true)
      })
      .catch(() => {
        if (active) setUsingLiveData(false)
      })
    return () => { active = false }
  }, [])

  return { requests, usingLiveData }
}

export function useEstimateRequestDetail(requestId: string | undefined) {
  const fallback = useMemo(() => getEstimateRequestById(requestId), [requestId])
  const [request, setRequest] = useState<EstimateRequestSummary | undefined>(fallback)
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [usingLiveData, setUsingLiveData] = useState(false)
  const numericId = Number(requestId)

  useEffect(() => {
    setRequest(fallback)
    setQuotes([])
    setUsingLiveData(false)
    if (!Number.isInteger(numericId) || numericId <= 0) return
    let active = true
    Promise.all([getRequest(numericId), getQuotesByRequest(numericId)])
      .then(([liveRequest, liveQuotes]) => {
        if (!active) return
        setRequest(toEstimateRequestSummary(liveRequest))
        setQuotes(liveQuotes)
        setUsingLiveData(true)
      })
      .catch(() => {
        if (active) setUsingLiveData(false)
      })
    return () => { active = false }
  }, [fallback, numericId])

  return { request, quotes, usingLiveData, numericId }
}
