import { useEffect, useState } from 'react'
import { getQuote } from '@/api/estimateApi'
import { getRequest } from '@/api/requestApi'
import type { QuoteResponse } from '@/types/backendContractor'
import type { ContractorEstimateDraft, ContractorSentEstimate } from '@/types/contractorPortal'
import type { RequestResponse } from '@/types/request'
import { quoteToContractorEstimateDraft, quoteToContractorSentEstimate } from '@/utils/contractorQuoteAdapter'

export default function useContractorQuote(estimateId?: string) {
  const liveId = estimateId && /^\d+$/.test(estimateId) ? Number(estimateId) : null
  const [state, setState] = useState<{ id: number | null; quote: QuoteResponse | null; request: RequestResponse | null; view: ContractorSentEstimate | null; draft: ContractorEstimateDraft | null; loading: boolean; error: string }>({ id: null, quote: null, request: null, view: null, draft: null, loading: Boolean(liveId), error: '' })

  useEffect(() => {
    if (!liveId) { setState({ id: null, quote: null, request: null, view: null, draft: null, loading: false, error: '' }); return }
    let active = true
    setState({ id: liveId, quote: null, request: null, view: null, draft: null, loading: true, error: '' })
    void getQuote(liveId)
      .then(async (quote) => ({ quote, request: await getRequest(quote.requestId) }))
      .then(({ quote, request }) => {
        if (active) setState({ id: liveId, quote, request, view: quoteToContractorSentEstimate(quote, request), draft: quoteToContractorEstimateDraft(quote, request), loading: false, error: '' })
      })
      .catch((reason: unknown) => {
        if (active) setState({ id: liveId, quote: null, request: null, view: null, draft: null, loading: false, error: reason instanceof Error ? reason.message : '견적을 불러오지 못했습니다.' })
      })
    return () => { active = false }
  }, [liveId])
  return state.id === liveId ? state : { ...state, quote: null, request: null, view: null, draft: null, loading: Boolean(liveId), error: '' }
}
