import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import useContractorRequest from '@/hooks/useContractorRequest'
import type { ContractorRequestDetail } from '@/types/contractorPortal'
import ContractorRequestFloorPlanPage from './ContractorRequestFloorPlanPage'
import ContractorRequestPhotosPage from './ContractorRequestPhotosPage'

vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))
vi.mock('@/utils/contractorRequestDecision', () => ({ approveContractorRequest: vi.fn(), rejectContractorRequest: vi.fn() }))

const useContractorRequestMock = vi.mocked(useContractorRequest)
const fixture: ContractorRequestDetail = {
  requestId: '99', customerName: '시연 임대인', maskedPhone: '010-****-0000',
  property: { region: '광주', address: '광주광역시 서구', propertyType: '아파트', areaLabel: '84㎡' },
  budgetLabel: '협의', estimatedCostLabel: '분석 대기', matchScore: 90, desiredSchedule: '2026-09-01',
  status: 'in_progress', statusLabel: '승인됨', participationStatus: 'APPROVED', lastActivityLabel: '2026-08-19',
  analysis: { rooms: 3, bathrooms: 2, hasBalcony: true, kitchenType: '독립형', ceilingHeight: '2.3m' },
  selectedItems: [], lightingNotice: '', hasLinkedFloorPlan: false, photos: [],
}

function renderPage(path: string, page: 'floor-plan' | 'photos') {
  const Page = page === 'floor-plan' ? ContractorRequestFloorPlanPage : ContractorRequestPhotosPage
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path={`/contractor/requests/:requestId/${page}`} element={<Page />} /></Routes></MemoryRouter>)
}

describe('live contractor request media', () => {
  beforeEach(() => useContractorRequestMock.mockReset().mockReturnValue({ request: fixture, loading: false, error: '' }))
  afterEach(cleanup)

  it('renders the uploaded user floor plan', () => {
    useContractorRequestMock.mockReturnValue({ request: { ...fixture, floorPlanImage: '/api/files/images/user-plan.png', hasLinkedFloorPlan: true }, loading: false, error: '' })
    renderPage('/contractor/requests/99/floor-plan', 'floor-plan')
    expect(screen.getByRole('img', { name: /평면도/ })).toHaveAttribute('src', '/api/files/images/user-plan.png')
  })

  it('renders a floor-plan empty state instead of a clickable mock preview', () => {
    renderPage('/contractor/requests/99/floor-plan', 'floor-plan')
    expect(screen.getByText('사용자가 등록한 평면도가 없습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '평면도 크게 보기' })).not.toBeInTheDocument()
  })

  it('renders uploaded user photos', () => {
    useContractorRequestMock.mockReturnValue({ request: { ...fixture, photos: [{ id: '7', label: '공간 사진 1', image: '/api/files/images/room.png' }] }, loading: false, error: '' })
    renderPage('/contractor/requests/99/photos', 'photos')
    expect(screen.getByRole('img', { name: '공간 사진 1' })).toHaveAttribute('src', '/api/files/images/room.png')
  })

  it('renders a live empty state instead of bundled room or AI photos', () => {
    renderPage('/contractor/requests/99/photos', 'photos')
    expect(screen.getByText('사용자가 등록한 공간 사진이 없습니다.')).toBeInTheDocument()
    expect(screen.queryByAltText('AI 인테리어 시뮬레이션 전')).not.toBeInTheDocument()
    expect(screen.queryByAltText('AI 인테리어 시뮬레이션 후')).not.toBeInTheDocument()
  })
})
