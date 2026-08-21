import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getVisit } from '@/api/visitApi'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorRequest from '@/hooks/useContractorRequest'
import ContractorVisitPage from './ContractorVisitPage'

vi.mock('@/api/visitApi', () => ({
  getVisit: vi.fn(),
  acceptVisitChange: vi.fn(),
  completeVisit: vi.fn(),
  proposeVisitChange: vi.fn(),
  registerVisit: vi.fn(),
  rejectVisitChange: vi.fn(),
}))
vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))

const getVisitMock = vi.mocked(getVisit)
const useContractorRequestMock = vi.mocked(useContractorRequest)

describe('ContractorVisitPage live schedule', () => {
  beforeEach(() => {
    getVisitMock.mockReset().mockRejectedValue(new Error('방문 일정이 없습니다.'))
    useContractorRequestMock.mockReset().mockReturnValue({
      request: {
        requestId: '99', customerName: '시연 임대인', maskedPhone: '010-****-0000',
        property: { region: '광주', address: '광주광역시 서구', propertyType: '아파트', areaLabel: '84㎡' },
        budgetLabel: '협의', estimatedCostLabel: '분석 대기', matchScore: 90, desiredSchedule: '2026-09-01',
        status: 'in_progress', statusLabel: '승인됨', lastActivityLabel: '2026-08-19',
        analysis: { rooms: 3, bathrooms: 2, hasBalcony: true, kitchenType: '독립형', ceilingHeight: '2.3m' },
        selectedItems: [], lightingNotice: '', hasLinkedFloorPlan: false, photos: [],
      }, loading: false, error: '',
    })
  })

  afterEach(cleanup)

  it('does not expose an empty registration form when the live status lookup fails', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/requests/99/visit']}>
        <Routes>
          <Route path="/contractor/requests/:requestId/visit" element={<ContractorPortalFlowProvider><ContractorVisitPage /></ContractorPortalFlowProvider>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('방문 일정이 없습니다.')
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '방문 일정 등록' })).not.toBeInTheDocument()
    expect(screen.queryByText(/2026\.07\.24/)).not.toBeInTheDocument()
  })
})
