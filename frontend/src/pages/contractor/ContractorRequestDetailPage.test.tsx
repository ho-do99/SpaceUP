import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAnalysis } from '@/api/analysisApi'
import { getRequest, getRequestImages } from '@/api/requestApi'
import ContractorRequestDetailPage from './ContractorRequestDetailPage'

vi.mock('@/api/analysisApi', () => ({ getAnalysis: vi.fn() }))
vi.mock('@/api/requestApi', () => ({ getRequest: vi.fn(), getRequestImages: vi.fn() }))

const getRequestMock = vi.mocked(getRequest)
const getRequestImagesMock = vi.mocked(getRequestImages)
const getAnalysisMock = vi.mocked(getAnalysis)

const requestFixture = {
  id: 99,
  region: '광주광역시 서구',
  propertyType: 'APARTMENT',
  areaM2: 84,
  budget: 5000000,
  desiredDate: '2026-09-01',
  requestedItems: '도배, 바닥재',
  status: 'QUOTE_REQUESTED',
  matchingScore: 90,
}

function renderRequestDetail(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/contractor/requests/:requestId" element={<ContractorRequestDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ContractorRequestDetailPage', () => {
  beforeEach(() => {
    getRequestMock.mockReset()
    getRequestImagesMock.mockReset().mockResolvedValue([])
    getAnalysisMock.mockReset().mockRejectedValue(new Error('분석 대기'))
  })

  it('does not offer approval again after the participation is approved', async () => {
    getRequestMock.mockResolvedValue({
      ...requestFixture,
      participationStatus: 'APPROVED',
      landlordName: '시연 임대인',
    })

    renderRequestDetail('/contractor/requests/99')

    expect(await screen.findByText(/시연 임대인/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '의뢰 승인' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /채팅/ }).find((link) => link.getAttribute('href') === '/contractor/requests/99/chat')).toBeDefined()
  })
})
