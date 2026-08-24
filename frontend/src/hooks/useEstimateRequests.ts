import { useEffect, useMemo, useState } from 'react'
import { getMyEstimateRequests, getRequest } from '@/api/requestApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import { getEstimateRequestById, type EstimateRequestSummary } from '@/mocks/estimateRequests'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

const won = new Intl.NumberFormat('ko-KR')

function requestStatus(status?: string, acceptedQuotePhase?: RequestResponse['acceptedQuotePhase']) {
  if (acceptedQuotePhase === 'FINAL') return { status: 'requested' as const, label: '결제 준비', progress: '최종 견적 승인 완료' }
  if (acceptedQuotePhase === 'PRELIMINARY') return { status: 'requested' as const, label: '방문 준비', progress: '1차 견적 승인 완료' }
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
  const state = requestStatus(request.status, request.acceptedQuotePhase)
  const budget = request.budgetMax ?? request.budget ?? request.budgetMin
  const contractorName = request.contractorNames?.length ? request.contractorNames.join(', ') : request.contractorId ? `선택 시공사 #${request.contractorId}` : '여러 시공사 견적 비교'
  return {
    id: String(request.id),
    requestCode: request.requestCode ?? `REQ-ID-${request.id}`,
    contractorId: request.contractorId ? String(request.contractorId) : '',
    contractorName,
    regionAndSpecialty: `${request.region} · ${request.requestCode ?? `REQ-ID-${request.id}`}`,
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
  const [requests, setRequests] = useState<readonly EstimateRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getMyEstimateRequests({ size: 100 }).then((page) => {
      if (active) setRequests(page.content.map(toEstimateRequestSummary))
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : '견적 요청 내역을 불러오지 못했습니다.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  return {
    requests,
    usingLiveData: true,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  }
}

export function useEstimateRequestDetail(requestId: string | undefined) {
  const fallback = useMemo(() => getEstimateRequestById(requestId), [requestId])
  const numericId = Number(requestId)
  const isNumeric = Number.isInteger(numericId) && numericId > 0
  const [request, setRequest] = useState<EstimateRequestSummary | undefined>(isNumeric ? undefined : fallback)
  const [quotes, setQuotes] = useState<QuoteResponse[]>([])
  const [usingLiveData, setUsingLiveData] = useState(false)
  const [loading, setLoading] = useState(isNumeric)
  const [error, setError] = useState('')

  useEffect(() => {
    setRequest(isNumeric ? undefined : fallback)
    setQuotes([])
    setUsingLiveData(false)
    setError('')
    if (!isNumeric) { setLoading(false); return }
    let active = true
    setLoading(true)
    Promise.all([getRequest(numericId), getQuotesByRequest(numericId)])
      .then(([liveRequest, liveQuotes]) => {
        if (!active) return
        setRequest(toEstimateRequestSummary(liveRequest))
        setQuotes(liveQuotes)
        setUsingLiveData(true)
      })
      .catch((loadError) => { if (active) { setUsingLiveData(false); setError(loadError instanceof Error ? loadError.message : '견적 요청 상세를 불러오지 못했습니다.') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fallback, isNumeric, numericId])

  return { request, quotes, usingLiveData, numericId, loading, error }
}
