import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getContractor } from '@/api/contractorApi'
import { ApiClientError } from '@/api/axiosInstance'
import { getVisit } from '@/api/visitApi'
import UserVisitSchedulePage from './UserVisitSchedulePage'

vi.mock('@/api/contractorApi', () => ({ getContractor: vi.fn() }))
vi.mock('@/api/visitApi', () => ({ getVisit: vi.fn(), requestVisitChange: vi.fn() }))

const getContractorMock = vi.mocked(getContractor)
const getVisitMock = vi.mocked(getVisit)

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
})
