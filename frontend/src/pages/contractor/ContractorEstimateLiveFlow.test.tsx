import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorQuote from '@/hooks/useContractorQuote'
import useContractorQuotes from '@/hooks/useContractorQuotes'
import { quoteToContractorEstimateDraft, quoteToContractorSentEstimate } from '@/utils/contractorQuoteAdapter'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'
import ContractorEstimateListPage from './ContractorEstimateListPage'
import ContractorEstimateDetailPage from './ContractorEstimateDetailPage'

vi.mock('@/hooks/useContractorQuotes', () => ({ default: vi.fn() }))
vi.mock('@/hooks/useContractorQuote', () => ({ default: vi.fn() }))
const useContractorQuotesMock = vi.mocked(useContractorQuotes)
const useContractorQuoteMock = vi.mocked(useContractorQuote)

const quote: QuoteResponse = { id: 41, requestId: 99, contractorId: 7, contractorName: '시연 시공사', title: '실견적', startDate: '2026-09-01', durationDays: 3, totalAmount: 5500000, status: 'SUBMITTED', phase: 'FINAL', validUntil: '2026-09-15', revisionCount: 0, items: [{ category: '바닥재', description: '강마루', amount: 5500000 }] }
const request = { id: 99, requestCode: 'REQ-99', landlordName: '시연 임대인', region: '광주광역시 서구', propertyType: 'APARTMENT', areaM2: 84, status: 'QUOTE_REQUESTED', requestedItems: '바닥재' } as RequestResponse
const view = quoteToContractorSentEstimate(quote, request)
const draft = quoteToContractorEstimateDraft(quote, request)

describe('contractor live quote pages', () => {
  beforeEach(() => {
    useContractorQuotesMock.mockReset().mockReturnValue({ items: [{ quote, request, estimate: view, status: 'SUBMITTED', validUntil: '2026-09-15' }], loading: false, error: '' })
    useContractorQuoteMock.mockReset().mockReturnValue({ id: 41, quote, request, view, draft, loading: false, error: '' })
  })
  afterEach(cleanup)

  it('lists API quote views with the landlord nickname', () => {
    render(<MemoryRouter><ContractorEstimateListPage /></MemoryRouter>)
    expect(screen.getByText(/시연 임대인/)).toBeInTheDocument()
    expect(screen.queryByText('김지선')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '견적 상세' })).toHaveAttribute('href', '/contractor/estimates/41')
  })

  it('loads numeric quote detail from the live hook', () => {
    render(<MemoryRouter initialEntries={['/contractor/estimates/41']}><Routes><Route path="/contractor/estimates/:estimateId" element={<ContractorPortalFlowProvider><ContractorEstimateDetailPage /></ContractorPortalFlowProvider>} /></Routes></MemoryRouter>)
    expect(screen.getAllByText('시연 임대인').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5,500,000원/).length).toBeGreaterThan(0)
    expect(useContractorQuoteMock).toHaveBeenCalledWith('41')
  })
})
