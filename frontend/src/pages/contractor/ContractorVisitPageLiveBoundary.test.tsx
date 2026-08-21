import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acceptVisitChange, getVisit, registerVisit } from '@/api/visitApi'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorRequest from '@/hooks/useContractorRequest'
import ContractorVisitPage from './ContractorVisitPage'

vi.mock('@/api/visitApi', () => ({
  getVisit: vi.fn(), acceptVisitChange: vi.fn(), completeVisit: vi.fn(),
  proposeVisitChange: vi.fn(), registerVisit: vi.fn(), rejectVisitChange: vi.fn(),
}))
vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))

const getVisitMock = vi.mocked(getVisit)
const acceptVisitChangeMock = vi.mocked(acceptVisitChange)
const registerVisitMock = vi.mocked(registerVisit)
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
    acceptVisitChangeMock.mockReset()
    registerVisitMock.mockReset()
  })
  afterEach(cleanup)

  it('starts an unscheduled live visit with empty API-backed fields', async () => {
    renderVisit()

    expect(await screen.findByText('등록된 방문 일정이 없습니다')).toBeInTheDocument()
    expect(screen.getByLabelText('방문 날짜')).toHaveValue('')
    expect(screen.getByLabelText('방문 시간')).toHaveValue('')
    expect(screen.getByLabelText('담당자')).toHaveValue('')
  })

  it('uses the same fixed visit-time selector as the user schedule screen', async () => {
    renderVisit()

    await screen.findByText('등록된 방문 일정이 없습니다')
    const timeSelect = screen.getByRole('combobox', { name: '방문 시간' })
    expect(within(timeSelect).getAllByRole('option').map((option) => option.textContent)).toEqual([
      '방문 시간을 선택해주세요.',
      '오전 9:00',
      '오전 10:00',
      '오전 11:00',
      '오후 1:00',
      '오후 2:00',
      '오후 3:00',
      '오후 4:00',
      '오후 5:00',
    ])
  })

  it('does not force completed mode without a completed API visit', async () => {
    renderVisit('/contractor/requests/99/visit?mode=completed')

    expect(await screen.findByText('등록된 방문 일정이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('현장 방문 완료')).not.toBeInTheDocument()
  })

  it('links a completed live visit directly to the final estimate editor', async () => {
    getVisitMock.mockResolvedValue({ id: 3, requestId: 99, contractorId: 7, status: 'COMPLETED', visitDate: '2026-08-22', visitTime: '10:00:00', completedAt: '2026-08-22T11:00:00' })
    renderVisit()

    const link = await screen.findByRole('link', { name: '견적 작성으로 이동' })
    expect(link).toHaveAttribute('href', '/contractor/requests/99/estimate?mode=completed')
  })

  it('shows the first user schedule request as a confirmation flow', async () => {
    getVisitMock.mockResolvedValue({
      id: 3, requestId: 99, contractorId: 7, status: 'CHANGE_REQUESTED',
      requestedDate: '2026-09-08', requestedTime: '14:00:00', requestReason: '오후 방문 희망',
    })
    renderVisit()

    expect(await screen.findByRole('heading', { name: '방문 일정 요청' })).toBeInTheDocument()
    expect(screen.queryByText('기존 일정')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '방문 일정 확정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '방문 요청 거절' })).toBeInTheDocument()
  })

  it('prevents duplicate confirmation requests while the first action is pending', async () => {
    getVisitMock.mockResolvedValue({
      id: 3, requestId: 99, contractorId: 7, status: 'CHANGE_REQUESTED',
      requestedDate: '2026-09-08', requestedTime: '14:00:00', requestReason: '오후 방문 희망',
    })
    let resolveAccept!: (value: Awaited<ReturnType<typeof acceptVisitChange>>) => void
    acceptVisitChangeMock.mockImplementation(() => new Promise((resolve) => { resolveAccept = resolve }))
    renderVisit()

    const confirm = await screen.findByRole('button', { name: '방문 일정 확정' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    expect(acceptVisitChangeMock).toHaveBeenCalledTimes(1)

    resolveAccept({
      id: 3, requestId: 99, contractorId: 7, status: 'SCHEDULED',
      visitDate: '2026-09-08', visitTime: '14:00:00',
    })
    await waitFor(() => expect(screen.getByText('현장 방문 예정')).toBeInTheDocument())
  })

  it('prevents duplicate initial registration requests', async () => {
    let resolveRegister!: (value: Awaited<ReturnType<typeof registerVisit>>) => void
    registerVisitMock.mockImplementation(() => new Promise((resolve) => { resolveRegister = resolve }))
    renderVisit()

    fireEvent.change(await screen.findByLabelText('방문 날짜'), { target: { value: '2026-09-08' } })
    fireEvent.change(screen.getByLabelText('방문 시간'), { target: { value: '14:00' } })
    const submit = screen.getByRole('button', { name: '방문 일정 등록' })
    fireEvent.click(submit)
    fireEvent.click(submit)
    expect(registerVisitMock).toHaveBeenCalledTimes(1)

    resolveRegister({
      id: 3, requestId: 99, contractorId: 7, status: 'SCHEDULED',
      visitDate: '2026-09-08', visitTime: '14:00:00',
    })
    await waitFor(() => expect(screen.getByText('현장 방문 예정')).toBeInTheDocument())
  })
})
