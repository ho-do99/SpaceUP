import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EstimateRequestPage from './EstimateRequestPage'
import { setActiveRequestId } from '@/utils/requestFlow'

const getContractor = vi.fn()
const getRequest = vi.fn()
const getAnalysis = vi.fn()
const getMember = vi.fn()
const updateRequest = vi.fn()
const inviteContractor = vi.fn()

vi.mock('@/api/contractorApi', () => ({ getContractor: (...args: unknown[]) => getContractor(...args) }))
vi.mock('@/api/requestApi', () => ({
  ACTIVE_REQUEST_ID_KEY: 'spaceup.activeRequestId',
  getRequest: (...args: unknown[]) => getRequest(...args),
  updateRequest: (...args: unknown[]) => updateRequest(...args),
  inviteContractor: (...args: unknown[]) => inviteContractor(...args),
}))
vi.mock('@/api/analysisApi', () => ({ getAnalysis: (...args: unknown[]) => getAnalysis(...args) }))
vi.mock('@/api/memberApi', () => ({ getMember: (...args: unknown[]) => getMember(...args) }))
vi.mock('@/utils/authSession', () => ({ getMemberId: () => 9 }))

describe('EstimateRequestPage live defaults', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActiveRequestId(77)
    getContractor.mockResolvedValue({ memberId: 20, memberName: '시연웅', companyName: '마블건축', activityRegions: '광주 서구', specialties: '바닥재', rating: 4.8, reviewCount: 30 })
    getRequest.mockResolvedValue({ id: 77, region: '광주광역시 서구', propertyType: 'APARTMENT', areaM2: 84, budgetMin: 15_000_000, budgetMax: 15_000_000, desiredDate: '2026-09-05', requestedItems: '바닥재,벽지,조명' })
    getAnalysis.mockResolvedValue({ requestId: 77, status: 'COMPLETED', totalFloorAreaM2: 72, totalWallpaperAreaM2: 140 })
    getMember.mockResolvedValue({ id: 9, name: '시연 임대인', phoneNumber: '010-1234-5678' })
    updateRequest.mockReset().mockResolvedValue(undefined)
    inviteContractor.mockReset().mockResolvedValue(undefined)
  })

  it('prefills editable member, request, analysis area, budget and desired date values', async () => {
    render(<MemoryRouter initialEntries={[{ pathname: '/estimate/request', state: { contractorId: '20' } }]}><Routes><Route path="/estimate/request" element={<EstimateRequestPage />} /></Routes></MemoryRouter>)

    expect(await screen.findByDisplayValue('시연 임대인')).toBeInTheDocument()
    expect(screen.getByDisplayValue('010-1234-5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue('광주광역시 서구')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1,500')).toBeInTheDocument()
    expect(screen.getByText('만원')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25.4평 / 바닥 72㎡ · 벽 140㎡')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2026-09-05')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('25.4평 / 바닥 72㎡ · 벽 140㎡'), { target: { value: '25평 / 전체 시공' } })
    await waitFor(() => expect(screen.getByDisplayValue('25평 / 전체 시공')).toBeInTheDocument())
  })

  afterEach(cleanup)

  it('blocks a false success when the active request id is missing', async () => {
    sessionStorage.clear()

    render(<MemoryRouter initialEntries={[{ pathname: '/estimate/request', state: { contractorId: '20' } }]}><Routes><Route path="/estimate/request" element={<EstimateRequestPage />} /><Route path="/estimate/request/complete" element={<p>request complete</p>} /></Routes></MemoryRouter>)

    expect(await screen.findByText(/진행 중인 의뢰 정보를 확인할 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '견적 요청하기' })).toBeDisabled()
    expect(updateRequest).not.toHaveBeenCalled()
    expect(inviteContractor).not.toHaveBeenCalled()
    expect(screen.queryByText('request complete')).not.toBeInTheDocument()
  })
})
