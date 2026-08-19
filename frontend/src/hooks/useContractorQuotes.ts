import { useEffect, useState } from 'react'
import { getAssignedRequests } from '@/api/contractorApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import { quoteLifecycleStatus, quoteToContractorSentEstimate } from '@/utils/contractorQuoteAdapter'
import type { QuoteResponse } from '@/types/backendContractor'
import type { ContractorEstimateLifecycleStatus, ContractorSentEstimate } from '@/types/contractorPortal'
import type { RequestResponse } from '@/types/request'

export interface LiveContractorQuoteItem {
  quote: QuoteResponse
  request: RequestResponse
  estimate: ContractorSentEstimate
  status: ContractorEstimateLifecycleStatus
  validUntil: string
}

export default function useContractorQuotes() {
  const [items, setItems] = useState<LiveContractorQuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    void getAssignedRequests({ size: 100 })
      .then(async (page) => {
        const groups = await Promise.all(page.content.map(async (request) => {
          try {
            const quotes = await getQuotesByRequest(request.id)
            return quotes.filter((quote) => quote.status !== 'DRAFT').map((quote) => ({
              quote, request, estimate: quoteToContractorSentEstimate(quote, request),
              status: quoteLifecycleStatus(quote), validUntil: quote.validUntil || '-',
            }))
          } catch {
            return []
          }
        }))
        if (active) setItems(groups.flat())
      })
      .catch((reason: unknown) => {
        if (active) { setItems([]); setError(reason instanceof Error ? reason.message : '견적 목록을 불러오지 못했습니다.') }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return { items, loading, error }
}
