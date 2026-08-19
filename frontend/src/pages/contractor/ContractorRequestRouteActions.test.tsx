import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import useContractorRequest from '@/hooks/useContractorRequest'
import type { ContractorRequestDetail } from '@/types/contractorPortal'
import { approveContractorRequest } from '@/utils/contractorRequestDecision'
import ContractorRequestFloorPlanPage from './ContractorRequestFloorPlanPage'
import ContractorRequestPhotosPage from './ContractorRequestPhotosPage'

vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))
vi.mock('@/utils/contractorRequestDecision', () => ({
  approveContractorRequest: vi.fn(),
  rejectContractorRequest: vi.fn(),
}))

const useContractorRequestMock = vi.mocked(useContractorRequest)
const approveContractorRequestMock = vi.mocked(approveContractorRequest)

const requestFixture: ContractorRequestDetail = {
  requestId: '99',
  customerName: '시연 임대인',
  maskedPhone: '010-12**-****',
  property: { region: '광주광역시 서구', address: '광주광역시 서구', propertyType: '아파트', areaLabel: '84㎡' },
  budgetLabel: '5,000,000원',
  estimatedCostLabel: '분석 대기 중',
  matchScore: 90,
  desiredSchedule: '2026-09-01',
  status: 'reviewing',
  statusLabel: '검토 중',
  lastActivityLabel: '2026-08-19',
  analysis: { rooms: 3, bathrooms: 2, hasBalcony: true, kitchenType: '독립형', ceilingHeight: '2.3m' },
  selectedItems: ['도배', '바닥재'],
  lightingNotice: '조명 별도 협의',
  hasLinkedFloorPlan: false,
  photos: [],
}

const routes: readonly [string, ComponentType][] = [
  ['/contractor/requests/:requestId/floor-plan', ContractorRequestFloorPlanPage],
  ['/contractor/requests/:requestId/photos', ContractorRequestPhotosPage],
]

function renderRoute(path: string, Page: ComponentType) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path={path.replace('99', ':requestId')} element={<Page />} /></Routes>
    </MemoryRouter>,
  )
}

describe('contractor request route actions', () => {
  afterEach(cleanup)

  beforeEach(() => {
    useContractorRequestMock.mockReset().mockReturnValue({ request: requestFixture, loading: false, error: '' })
    approveContractorRequestMock.mockReset()
  })

  it.each(routes)('offers only chat for selected requests on %s', (route, Page) => {
    useContractorRequestMock.mockReturnValue({ request: { ...requestFixture, participationStatus: 'SELECTED' }, loading: false, error: '' })

    renderRoute(route.replace(':requestId', '99'), Page)

    expect(screen.queryByRole('button', { name: '의뢰 승인' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '의뢰 거절' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '채팅 계속하기' })).toHaveAttribute('href', '/contractor/requests/99/chat')
  })

  it.each(routes)('locks both decisions while %s approval is pending', (route, Page) => {
    approveContractorRequestMock.mockReturnValue(new Promise(() => undefined))
    useContractorRequestMock.mockReturnValue({ request: { ...requestFixture, participationStatus: 'INVITED' }, loading: false, error: '' })

    renderRoute(route.replace(':requestId', '99'), Page)
    fireEvent.click(screen.getByRole('button', { name: '의뢰 승인' }))

    expect(screen.getByRole('button', { name: '의뢰 승인' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '의뢰 거절' })).toBeDisabled()
  })
})