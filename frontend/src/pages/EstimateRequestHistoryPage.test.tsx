import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { getMyEstimateRequests } from '@/api/requestApi'
import EstimateRequestHistoryPage from './EstimateRequestHistoryPage'

vi.mock('@/api/requestApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/requestApi')>()
  return { ...actual, getMyEstimateRequests: vi.fn() }
})

const getRequests = vi.mocked(getMyEstimateRequests)

function renderPage() {
  return render(<MemoryRouter><EstimateRequestHistoryPage /></MemoryRouter>)
}

describe('EstimateRequestHistoryPage', () => {
  beforeEach(() => {
    getRequests.mockReset().mockResolvedValue({
      content: [{
        id: 17,
        requestCode: 'REQ-260820-000017',
        region: '광주 북구',
        propertyType: 'APARTMENT',
        areaM2: 84,
        requestedItems: '바닥재, 벽지, 조명',
        status: 'QUOTE_REQUESTED',
        createdAt: '2026-08-20T09:00:00',
        contractorNames: ['마블건축'],
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 100,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows live requests without a deletion control', async () => {
    renderPage()
    expect(await screen.findByText('마블건축')).toBeInTheDocument()
    expect(screen.getByText('총 1건')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '마블건축 견적 요청 삭제' })).not.toBeInTheDocument()
  })
})
