import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getVisit } from '@/api/visitApi'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorRequest from '@/hooks/useContractorRequest'
import ContractorVisitPage from './ContractorVisitPage'

vi.mock('@/api/visitApi', () => ({
  getVisit: vi.fn(), acceptVisitChange: vi.fn(), completeVisit: vi.fn(),
  proposeVisitChange: vi.fn(), registerVisit: vi.fn(), rejectVisitChange: vi.fn(),
}))
vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))

const getVisitMock = vi.mocked(getVisit)
const useContractorRequestMock = vi.mocked(useContractorRequest)

function requestFixture() {
  return {
    requestId: '99', customerName: '시연 임대인', maskedPhone: '010-****-0000',
    property: { region: '광주', address: '광주광역시 서구', propertyType: '아파트' as const, areaLabel: '84㎡' },
    budgetLabel: '협의', estimatedCostLabel: '분석 대기', matchScore: 90, desiredSchedule: '2026-09-01',
    status: 'in_progress' as const, statusLabel: '승인됨', lastActivityLabel: '2026-08-19',
    analysis: { rooms: 3, bathrooms: 2, hasBalcony: true, kitchenType: '독립형', ceilingHeight: '2.3m' },
    selectedItems: [], lightingNotice: '', hasLinkedFloorPlan: false, photos: [],
  }
}

function renderVisit(path = '/contractor/requests/99/visit') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/contractor/requests/:requestId/visit" element={<ContractorPortalFlowProvider><ContractorVisitPage /></ContractorPortalFlowProvider>} /></Routes>
    </MemoryRouter>,
  )
}

describe('ContractorVisitPage live/mock boundary', () => {
  beforeEach(() => {
    useContractorRequestMock.mockReset().mockReturnValue({ request: requestFixture(), loading: false, error: '' })
    getVisitMock.mockReset().mockResolvedValue({ id: 3, requestId: 99, contractorId: 7, status: 'UNSCHEDULED' })
  })
  afterEach(cleanup)

  it('starts an unscheduled live visit with empty API-backed fields', async () => {
    renderVisit()

    expect(await screen.findByText('등록된 방문 일정이 없습니다')).toBeInTheDocument()
    expect(screen.getByLabelText('방문 날짜')).toHaveValue('')
    expect(screen.getByLabelText('방문 시간')).toHaveValue('')
    expect(screen.getByLabelText('담당자')).toHaveValue('')
  })

  it('does not force completed mode without a completed API visit', async () => {
    renderVisit('/contractor/requests/99/visit?mode=completed')

    expect(await screen.findByText('등록된 방문 일정이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('현장 방문 완료')).not.toBeInTheDocument()
  })
})
