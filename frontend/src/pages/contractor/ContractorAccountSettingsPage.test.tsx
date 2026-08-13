import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { getMember } from '@/api/memberApi'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import ContractorAccountSettingsPage from './ContractorAccountSettingsPage'

vi.mock('@/api/memberApi', () => ({
  getMember: vi.fn(),
  updateMember: vi.fn(),
  updateMyPhoneNumber: vi.fn(),
  updateMyPassword: vi.fn(),
  sendEmailVerificationCode: vi.fn(),
  confirmEmailVerificationCode: vi.fn(),
}))

const member = {
  id: 42,
  email: 'contractor@spaceup.co.kr',
  name: '시공사 담당자',
  phoneNumber: '010-1234-5678',
  phoneVerified: true,
  emailVerified: true,
  role: 'CONTRACTOR' as const,
  approvalStatus: 'APPROVED' as const,
  applicationNumber: null,
  approvalNumber: null,
  revisionMessage: null,
  revisionDeadline: null,
  createdAt: '2026-08-13',
}

describe('ContractorAccountSettingsPage logout', () => {
  beforeEach(() => {
    sessionStorage.setItem('accessToken', 'contractor-token')
    sessionStorage.setItem('memberId', '42')
    sessionStorage.setItem('role', 'CONTRACTOR')
    sessionStorage.setItem('spaceup.requestDraft', JSON.stringify({ region: '광주', propertyType: 'VILLA', areaM2: 59 }))
    sessionStorage.setItem('spaceup.activeRequestId', '77')
    sessionStorage.setItem('unrelated-setting', 'keep')
    vi.mocked(getMember).mockReset().mockResolvedValue(member)
  })

  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('enables logout and clears auth and request flow after confirmation', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/settings/account']}>
        <Routes>
          <Route path="/contractor/settings/account" element={<ContractorPortalFlowProvider><ContractorAccountSettingsPage /></ContractorPortalFlowProvider>} />
          <Route path="/login" element={<p>login destination</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => expect(getMember).toHaveBeenCalledWith(42))
    const logoutButton = screen.getByRole('button', { name: '로그아웃' })
    expect(logoutButton).toBeEnabled()
    fireEvent.click(logoutButton)
    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('login destination')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('memberId')).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
    expect(sessionStorage.getItem('spaceup.requestDraft')).toBeNull()
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBeNull()
    expect(sessionStorage.getItem('unrelated-setting')).toBe('keep')
  })

  it('keeps the session when logout is canceled', async () => {
    render(<MemoryRouter><ContractorPortalFlowProvider><ContractorAccountSettingsPage /></ContractorPortalFlowProvider></MemoryRouter>)
    await waitFor(() => expect(getMember).toHaveBeenCalledWith(42))
    fireEvent.click(screen.getByRole('button', { name: '로그아웃' }))
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBe('contractor-token')
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBe('77')
  })
})
