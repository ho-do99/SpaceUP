import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ContractorDashboardPage from './ContractorDashboardPage'
import type { RequestResponse } from '@/types/request'

const mocks = vi.hoisted(() => ({
  getContractorDashboard: vi.fn(),
  getAssignedRequests: vi.fn(),
  getVisit: vi.fn(),
  latestEvent: null as { type: string; sequence: number } | null,
}))

vi.mock('@/api/contractorApi', () => ({ getContractorDashboard: mocks.getContractorDashboard, getAssignedRequests: mocks.getAssignedRequests }))
vi.mock('@/api/visitApi', () => ({ getVisit: mocks.getVisit }))
vi.mock('@/contexts/useRealtime', () => ({ default: () => ({ latestEvent: mocks.latestEvent }) }))

describe('ContractorDashboardPage', () => {
  beforeEach(() => {
    mocks.latestEvent = null
    mocks.getContractorDashboard.mockReset()
      .mockResolvedValueOnce({ newLeadsCount: 1, quoteRequestedCount: 0, quoteSentCount: 0, contractPendingCount: 0, pendingSettlementAmount: 0 })
      .mockResolvedValueOnce({ newLeadsCount: 2, quoteRequestedCount: 0, quoteSentCount: 0, contractPendingCount: 0, pendingSettlementAmount: 0 })
    mocks.getAssignedRequests.mockReset().mockResolvedValue({ content: [{ id: 99, requestCode: 'REQ-99', landlordName: '시연 사용자', region: '광주', propertyType: 'APARTMENT', areaM2: 84, status: 'REVIEWING', participationStatus: 'INVITED' } as RequestResponse] })
    mocks.getVisit.mockReset().mockRejectedValue(new Error('no visit'))
  })
  afterEach(cleanup)

  it('shows assigned leads and refreshes immediately after a realtime notification', async () => {
    const view = render(<MemoryRouter><ContractorDashboardPage /></MemoryRouter>)
    expect(await screen.findByText('1건')).toBeInTheDocument()
    expect(screen.getByText(/시연 사용자/)).toBeInTheDocument()

    mocks.latestEvent = { type: 'NOTIFICATION_CHANGED', sequence: 1 }
    view.rerender(<MemoryRouter><ContractorDashboardPage /></MemoryRouter>)

    await waitFor(() => expect(mocks.getContractorDashboard).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('2건')).toBeInTheDocument()
  })
})
