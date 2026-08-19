import { useEffect, useState } from 'react'
import { getAnalysis } from '@/api/analysisApi'
import { getRequest, getRequestImages } from '@/api/requestApi'
import { findContractorRequestDetail } from '@/mocks/contractorPortalMockData'
import type { ContractorRequestDetail } from '@/types/contractorPortal'
import { requestToContractorDetail } from '@/utils/contractorRequestAdapter'

export default function useContractorRequest(requestId?: string) {
  const liveId = Boolean(requestId && /^\d+$/.test(requestId))
  const [request, setRequest] = useState<ContractorRequestDetail | null>(
    () => liveId ? null : findContractorRequestDetail(requestId) ?? null,
  )
  const [loading, setLoading] = useState(liveId)
  const [error, setError] = useState('')
  const [resolvedRequestId, setResolvedRequestId] = useState(requestId)

  useEffect(() => {
    if (!liveId) {
      setRequest(findContractorRequestDetail(requestId) ?? null)
      setLoading(false)
      setError('')
      setResolvedRequestId(requestId)
      return
    }
    let active = true
    setRequest(null)
    setError('')
    setResolvedRequestId(requestId)
    const id = Number(requestId)
    setLoading(true)
    Promise.all([
      getRequest(id),
      getRequestImages(id).catch(() => []),
      getAnalysis(id).catch(() => null),
    ]).then(([response, images, analysis]) => {
      if (active) setRequest(requestToContractorDetail(response, images, analysis))
    }).catch((caught) => {
      if (active) {
        setRequest(null)
        setError(caught instanceof Error ? caught.message : '의뢰 조회에 실패했습니다.')
      }
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [requestId, liveId])

  if (resolvedRequestId !== requestId) return { request: null, loading: liveId, error: '' }
  return { request, loading, error }
}
