import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getQuotesByRequest } from '@/api/estimateApi'
import useContractorPortalFlow from '@/components/contractor/useContractorPortalFlow'
import useContractorQuote from '@/hooks/useContractorQuote'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'
import {
  quoteToContractorEstimateDraft,
  quoteToContractorSentEstimate,
} from '@/utils/contractorQuoteAdapter'

import ContractorEstimateSentPage from './ContractorEstimateSentPage'

vi.mock('@/api/estimateApi', () => ({ getQuotesByRequest: vi.fn() }))
vi.mock('@/hooks/useContractorQuote', () => ({ default: vi.fn() }))
vi.mock('@/components/contractor/useContractorPortalFlow', () => ({ default: vi.fn() }))

const getQuotesByRequestMock = vi.mocked(getQuotesByRequest)
const useContractorQuoteMock = vi.mocked(useContractorQuote)
const useContractorPortalFlowMock = vi.mocked(useContractorPortalFlow)

const quote: QuoteResponse = {
  id: 91,
  requestId: 138,
  contractorId: 19,
  contractorName: '마블건축',
  title: '실측 최종 견적',
  startDate: '2026-08-27',
  durationDays: 2,
  totalAmount: 2_430_256,
  status: 'SUBMITTED',
  phase: 'FINAL',
  validUntil: '2026-09-06',
  revisionCount: 0,
  createdAt: '2026-08-23T07:40:00',
  items: [{ category: '바닥재', description: '강마루', amount: 2_430_256 }],
}

const request = {
  id: 138,
  requestCode: 'REQ-260823-000138',
  landlordName: '시연 임대인',
  region: '광주광역시 남구 효천3로 110',
  propertyType: 'APARTMENT',
  areaM2: 84,
  status: 'QUOTE_REQUESTED',
  requestedItems: '바닥재',
} as RequestResponse

const view = quoteToContractorSentEstimate(quote, request)
const draft = quoteToContractorEstimateDraft(quote, request)

describe('ContractorEstimateSentPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    getQuotesByRequestMock.mockReset().mockResolvedValue([
      {
        ...quote,
        id: 92,
        createdAt: '2026-08-22T07:40:00',
      },
      quote,
    ])
    useContractorPortalFlowMock.mockReset().mockReturnValue({
      estimateDraft: null,
      estimateStatus: 'IDLE',
      estimateSubmission: null,
    } as unknown as ReturnType<typeof useContractorPortalFlow>)
    useContractorQuoteMock.mockReset().mockImplementation((estimateId) => (
      estimateId === '91'
        ? { id: 91, quote, request, view, draft, loading: false, error: '' }
        : { id: null, quote: null, request: null, view: null, draft: null, loading: false, error: '' }
    ))
  })

  afterEach(cleanup)

  it('recovers the latest submitted quote from the server after session storage is cleared', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/requests/138/estimate/sent']}>
        <Routes>
          <Route
            path="/contractor/requests/:requestId/estimate/sent"
            element={<ContractorEstimateSentPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('#91')).toBeInTheDocument()
    expect(getQuotesByRequestMock).toHaveBeenCalledWith(138)
    expect(screen.queryByText('저장된 견적을 찾을 수 없습니다.')).not.toBeInTheDocument()
  })
})
