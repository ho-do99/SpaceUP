import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorQuote from '@/hooks/useContractorQuote'
import useContractorRequest from '@/hooks/useContractorRequest'
import { contractorDefaultEstimateDraft, contractorRequestDetails } from '@/mocks/contractorPortalMockData'
import { storeQuoteId } from '@/utils/quoteDraft'

import ContractorEstimatePreviewPage from './ContractorEstimatePreviewPage'

vi.mock('@/hooks/useContractorQuote', () => ({ default: vi.fn() }))
vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))

const useContractorQuoteMock = vi.mocked(useContractorQuote)
const useContractorRequestMock = vi.mocked(useContractorRequest)

describe('ContractorEstimatePreviewPage construction conditions', () => {
  beforeEach(() => {
    sessionStorage.clear()
    storeQuoteId(108, 41)
    useContractorRequestMock.mockReturnValue({
      request: contractorRequestDetails[0],
      loading: false,
      error: '',
    })
    useContractorQuoteMock.mockReturnValue({
      id: 41,
      quote: { revisionRequestNote: null } as never,
      request: null,
      view: null,
      draft: contractorDefaultEstimateDraft,
      loading: false,
      error: '',
    })
  })

  afterEach(cleanup)

  it('keeps the remaining construction conditions without completion date and payment terms', () => {
    render(
      <MemoryRouter initialEntries={['/contractor/requests/108/estimate/preview']}>
        <Routes>
          <Route
            path="/contractor/requests/:requestId/estimate/preview"
            element={<ContractorPortalFlowProvider><ContractorEstimatePreviewPage /></ContractorPortalFlowProvider>}
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('시공 예정일').length).toBeGreaterThan(0)
    expect(screen.getByText('예상 기간')).toBeInTheDocument()
    expect(screen.getByText('A/S 기간')).toBeInTheDocument()
    expect(screen.queryByText('완료 예정일')).not.toBeInTheDocument()
    expect(screen.queryByText('결제 조건')).not.toBeInTheDocument()
  })
})
