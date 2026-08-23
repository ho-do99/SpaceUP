import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssignedRequests } from '@/api/contractorApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

import ContractorEstimateListPage from './ContractorEstimateListPage'

vi.mock('@/api/contractorApi', () => ({ getAssignedRequests: vi.fn() }))
vi.mock('@/api/estimateApi', () => ({ getQuotesByRequest: vi.fn() }))

const getAssignedRequestsMock = vi.mocked(getAssignedRequests)
const getQuotesByRequestMock = vi.mocked(getQuotesByRequest)

const request = (id: number, landlordName: string): RequestResponse => ({
  id,
  requestCode: `REQ-${id}`,
  landlordId: id + 100,
  landlordName,
  region: '광주광역시 서구',
  propertyType: 'APARTMENT',
  areaM2: 84,
  status: 'QUOTE_REQUESTED',
  createdAt: '2026-08-20T09:00:00',
  lastActivityAt: '2026-08-20T09:00:00',
})

const quote = (id: number, requestId: number, createdAt: string): QuoteResponse => ({
  id,
  requestId,
  contractorId: 7,
  contractorName: '시연 시공사',
  title: '실견적',
  startDate: '2026-09-01',
  durationDays: 3,
  totalAmount: 5_500_000,
  status: 'SUBMITTED',
  phase: 'FINAL',
  validUntil: '2026-09-15',
  revisionRequestNote: null,
  revisionCount: 1,
  createdAt,
  items: [{ category: '바닥재', description: '강마루', amount: 5_500_000 }],
})

describe('ContractorEstimateListPage', () => {
  beforeEach(() => {
    const olderRequest = request(104, '이전 사용자')
    const latestRequest = request(106, '최신 사용자')
    getAssignedRequestsMock.mockResolvedValue({
      content: [olderRequest, latestRequest],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 100,
    })
    getQuotesByRequestMock.mockImplementation(async (requestId) => (
      requestId === 104
        ? [quote(4, 104, '2026-08-20T10:00:00')]
        : [quote(6, 106, '2026-08-21T10:00:00')]
    ))
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the connected user as the card title and places the latest quote first', async () => {
    render(<MemoryRouter><ContractorEstimateListPage /></MemoryRouter>)

    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2))
    const cards = screen.getAllByRole('article')

    expect(within(cards[0]).getByText('최신 사용자')).toBeInTheDocument()
    expect(within(cards[1]).getByText('이전 사용자')).toBeInTheDocument()
    expect(within(cards[0]).queryByText('6')).not.toBeInTheDocument()
    expect(within(cards[1]).queryByText('4')).not.toBeInTheDocument()
  })
})
