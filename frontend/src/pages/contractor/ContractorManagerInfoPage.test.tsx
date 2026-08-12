import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import ContractorManagerInfoPage from './ContractorManagerInfoPage'
import { getMyContractorProfile, updateMyContractorManager } from '@/api/contractorApi'
import { getMember, updateMember, updateMyPhoneNumber } from '@/api/memberApi'
import { getMemberId } from '@/utils/authSession'

vi.mock('@/api/contractorApi', () => ({ getMyContractorProfile: vi.fn(), updateMyContractorManager: vi.fn() }))
vi.mock('@/api/memberApi', () => ({ getMember: vi.fn(), updateMember: vi.fn(), updateMyPhoneNumber: vi.fn() }))
vi.mock('@/utils/authSession', () => ({ getMemberId: vi.fn() }))
vi.mock('@/components/contractor/ContractorAppBar', () => ({ default: () => <header>담당자 정보</header> }))

const member = { id: 12, email: 'manager@spaceup.co.kr', name: '김현수', phoneNumber: '010-1234-5678', phoneVerified: true, emailVerified: true, role: 'CONTRACTOR' as const, approvalStatus: 'APPROVED' as const, applicationNumber: null, approvalNumber: null, revisionMessage: null, revisionDeadline: null, createdAt: '2026-08-11' }
const updateMemberMock = vi.mocked(updateMember)
const updateManagerMock = vi.mocked(updateMyContractorManager)

describe('ContractorManagerInfoPage', () => {
  beforeEach(() => {
    vi.mocked(getMemberId).mockReturnValue(12)
    vi.mocked(getMember).mockReset().mockResolvedValue(member)
    vi.mocked(getMyContractorProfile).mockReset().mockResolvedValue({ id: 1, memberId: 12, memberName: '김현수', managerPosition: '팀장', consultationHours: '평일 09:00-18:00' })
    vi.mocked(updateMember).mockReset().mockResolvedValue(undefined)
    vi.mocked(updateMyPhoneNumber).mockReset().mockResolvedValue(undefined)
    vi.mocked(updateMyContractorManager).mockReset().mockResolvedValue(undefined)
  })
  afterEach(cleanup)

  it('saves each manager field through only its confirmed endpoint contract', async () => {
    render(<MemoryRouter><ContractorManagerInfoPage /></MemoryRouter>)
    await screen.findByDisplayValue('김현수')
    fireEvent.click(screen.getByRole('button', { name: '담당자 정보 저장' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('담당자 정보가 저장되었습니다.'))
    expect(updateMember).toHaveBeenCalledWith(12, { email: 'manager@spaceup.co.kr', name: '김현수' })
    expect(updateMyPhoneNumber).toHaveBeenCalledWith('010-1234-5678')
    expect(updateMyContractorManager).toHaveBeenCalledWith({ managerPosition: '팀장', consultationHours: '평일 09:00-18:00' })
    expect(updateMemberMock.mock.calls[0][1]).not.toHaveProperty('phoneNumber')
    expect(updateManagerMock.mock.calls[0][0]).not.toHaveProperty('name')
    expect(updateManagerMock.mock.calls[0][0]).not.toHaveProperty('email')
    expect(updateManagerMock.mock.calls[0][0]).not.toHaveProperty('phoneNumber')
  })

  it('does not show success when any save request fails and allows retry', async () => {
    vi.mocked(updateMyPhoneNumber).mockRejectedValueOnce(new Error('휴대폰 저장 실패'))
    render(<MemoryRouter><ContractorManagerInfoPage /></MemoryRouter>)
    await screen.findByDisplayValue('김현수')
    fireEvent.click(screen.getByRole('button', { name: '담당자 정보 저장' }))
    await screen.findByText('휴대폰 저장 실패')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '담당자 정보 저장' })).toBeEnabled()
    expect(screen.getByLabelText('담당자명')).toHaveValue('김현수')
  })
})
