import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContractor } from '@/api/contractorApi'
import { ApiClientError } from '@/api/axiosInstance'
import { getVisit, requestVisitChange } from '@/api/visitApi'
import UserVisitSchedulePage from './UserVisitSchedulePage'

vi.mock('@/api/contractorApi', () => ({ getContractor: vi.fn() }))
vi.mock('@/api/visitApi', () => ({ getVisit: vi.fn(), requestVisitChange: vi.fn() }))

const getContractorMock = vi.mocked(getContractor)
const getVisitMock = vi.mocked(getVisit)
const requestVisitChangeMock = vi.mocked(requestVisitChange)

function renderVisit() {
  return render(
    <MemoryRouter initialEntries={['/mypage/requests/99/visit/1']}>
      <Routes>
        <Route path="/mypage/requests/:requestId/visit/:contractorId" element={<UserVisitSchedulePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UserVisitSchedulePage live data', () => {
  beforeEach(() => {
    getContractorMock.mockReset().mockResolvedValue({
      id: 1,
      memberId: 1,
      memberName: '시연 시공사',
      companyName: '1204디자인 전남광주점 (시연용)',
      activityRegions: '광주',
      specialties: '리모델링',
      availableForConsult: true,
    })
    getVisitMock.mockReset().mockRejectedValue(new ApiClientError('방문 일정이 없습니다.', 'http', 404))
    requestVisitChangeMock.mockReset()
  })

  afterEach(cleanup)

  it('shows the selected contractor profile instead of bundled company text', async () => {
    renderVisit()

    expect(await screen.findByText('1204디자인 전남광주점 (시연용)')).toBeInTheDocument()
    expect(screen.getByText('광주 · 리모델링')).toBeInTheDocument()
    expect(screen.queryByText('공간디자인 인테리어')).not.toBeInTheDocument()
  })

  it('shows chat-first guidance and cannot fake success when no server visit exists', async () => {
    renderVisit()

    expect(await screen.findByText(/채팅에서 시공사와 일정을 먼저 협의/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '방문 일정 요청하기' })).not.toBeInTheDocument()
  })

  it('locks a pending user request instead of allowing duplicate submission', async () => {
    getVisitMock.mockResolvedValue({
      id: 3, requestId: 99, contractorId: 1, status: 'CHANGE_REQUESTED',
      requestedDate: '2026-09-08', requestedTime: '14:00:00', requestReason: '오후 방문 희망',
    })

    renderVisit()

    expect(await screen.findByText('시공사 확인을 기다리고 있습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /방문 일정 요청하기/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('방문 날짜 *')).toBeDisabled()
    expect(requestVisitChangeMock).not.toHaveBeenCalled()
  })

  it('sends an initial schedule request only once while the request is pending', async () => {
    getVisitMock.mockResolvedValue({ id: 3, requestId: 99, contractorId: 1, status: 'UNSCHEDULED' })
    let resolveRequest!: (value: Awaited<ReturnType<typeof requestVisitChange>>) => void
    requestVisitChangeMock.mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve }))
    renderVisit()

    fireEvent.change(await screen.findByLabelText('방문 날짜 *'), { target: { value: '2026-09-08' } })
    fireEvent.change(screen.getByLabelText('방문 시간 *'), { target: { value: '14:00' } })
    fireEvent.change(screen.getByPlaceholderText('방문 전 전달할 내용을 입력해주세요.'), { target: { value: '오후 방문 희망' } })
    const submit = screen.getByRole('button', { name: '방문 일정 요청하기' })
    fireEvent.click(submit)
    fireEvent.click(submit)

    expect(requestVisitChangeMock).toHaveBeenCalledTimes(1)
    resolveRequest({
      id: 3, requestId: 99, contractorId: 1, status: 'CHANGE_REQUESTED',
      requestedDate: '2026-09-08', requestedTime: '14:00:00', requestReason: '오후 방문 희망',
    })
    await waitFor(() => expect(screen.getByText('방문 일정 요청이 완료되었습니다.')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /방문 일정 요청하기/ })).not.toBeInTheDocument()
  })
})
