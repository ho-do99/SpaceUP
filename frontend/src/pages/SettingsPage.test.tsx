import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiClientError } from '@/api/axiosInstance'
import { deleteMember, getMember, updateMyPassword, updateMyPhoneNumber } from '@/api/memberApi'
import SettingsPage from './SettingsPage'

vi.mock('@/api/memberApi', () => ({
  deleteMember: vi.fn(),
  getMember: vi.fn(),
  updateMyPassword: vi.fn(),
  updateMyPhoneNumber: vi.fn(),
}))

const deleteMemberRequest = vi.mocked(deleteMember)
const getMemberRequest = vi.mocked(getMember)
const updatePasswordRequest = vi.mocked(updateMyPassword)
const updatePhoneRequest = vi.mocked(updateMyPhoneNumber)

const member = {
  id: 17,
  email: 'landlord@spaceup.test',
  name: '임대인',
  phoneNumber: '010-1234-5678',
  phoneVerified: true,
  emailVerified: true,
  role: 'LANDLORD' as const,
  approvalStatus: 'APPROVED' as const,
  applicationNumber: null,
  approvalNumber: null,
  revisionMessage: null,
  revisionDeadline: null,
  createdAt: '2026-08-12T00:00:00',
}

function seedUserSession() {
  sessionStorage.setItem('accessToken', 'landlord-token')
  sessionStorage.setItem('memberId', '17')
  sessionStorage.setItem('role', 'LANDLORD')
  sessionStorage.setItem('spaceup.requestDraft', JSON.stringify({ region: '광주', propertyType: 'APARTMENT' }))
  sessionStorage.setItem('spaceup.activeRequestId', '91')
  sessionStorage.setItem('unrelated-setting', 'keep')
}

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<p>login destination</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function openDialog(buttonName: '로그아웃' | '회원탈퇴') {
  fireEvent.click(screen.getByRole('button', { name: buttonName }))
  return screen.getByRole('alertdialog')
}

describe('SettingsPage account actions', () => {
  beforeEach(() => {
    sessionStorage.clear()
    deleteMemberRequest.mockReset().mockResolvedValue(undefined)
    getMemberRequest.mockReset().mockResolvedValue(member)
    updatePasswordRequest.mockReset().mockResolvedValue(undefined)
    updatePhoneRequest.mockReset().mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('renders the authenticated member email instead of a mock profile value', async () => {
    seedUserSession()
    renderSettings()

    expect(await screen.findByText('landlord@spaceup.test')).toBeInTheDocument()
    expect(getMemberRequest).toHaveBeenCalledWith(17)
  })

  it('enables logout, confirms it without an API request, and clears only auth and request flow storage', async () => {
    seedUserSession()
    renderSettings()

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '회원탈퇴' })).toBeEnabled()

    let dialog = openDialog('로그아웃')
    expect(within(dialog).getByText('로그아웃하시겠습니까?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBe('landlord-token')
    expect(deleteMemberRequest).not.toHaveBeenCalled()

    dialog = openDialog('로그아웃')
    fireEvent.click(within(dialog).getByRole('button', { name: '로그아웃' }))

    expect(await screen.findByText('login destination')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('memberId')).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
    expect(sessionStorage.getItem('spaceup.requestDraft')).toBeNull()
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBeNull()
    expect(sessionStorage.getItem('unrelated-setting')).toBe('keep')
    expect(deleteMemberRequest).not.toHaveBeenCalled()
  })

  it('cancels withdrawal without DELETE and submits only once before clearing the session', async () => {
    seedUserSession()
    let resolveDelete!: () => void
    deleteMemberRequest.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDelete = resolve }),
    )
    renderSettings()

    let dialog = openDialog('회원탈퇴')
    expect(within(dialog).getByText('정말 회원탈퇴를 진행하시겠습니까?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }))
    expect(deleteMemberRequest).not.toHaveBeenCalled()

    dialog = openDialog('회원탈퇴')
    const confirmButton = within(dialog).getByRole('button', { name: '회원탈퇴' })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    expect(deleteMemberRequest).toHaveBeenCalledTimes(1)
    expect(deleteMemberRequest).toHaveBeenCalledWith(17)
    expect(within(dialog).getByRole('button', { name: '처리 중...' })).toBeDisabled()

    await act(async () => resolveDelete())

    expect(await screen.findByText('login destination')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBeNull()
    expect(sessionStorage.getItem('unrelated-setting')).toBe('keep')
  })

  it('does not call DELETE when memberId is unavailable', () => {
    sessionStorage.setItem('accessToken', 'landlord-token')
    sessionStorage.setItem('role', 'LANDLORD')
    renderSettings()

    const dialog = openDialog('회원탈퇴')
    fireEvent.click(within(dialog).getByRole('button', { name: '회원탈퇴' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      '회원 정보를 확인할 수 없습니다. 다시 로그인한 후 시도해 주세요.',
    )
    expect(deleteMemberRequest).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('accessToken')).toBe('landlord-token')
  })

  it.each([
    [400, new ApiClientError('입력 정보를 확인해 주세요.', 'http', 400)],
    [401, new ApiClientError('로그인이 필요합니다.', 'http', 401)],
    [403, new ApiClientError('탈퇴 권한이 없습니다.', 'http', 403)],
    [404, new ApiClientError('회원 정보를 찾을 수 없습니다.', 'http', 404)],
    [409, new ApiClientError('현재 상태에서는 탈퇴할 수 없습니다.', 'http', 409)],
    [500, new ApiClientError('서버 오류가 발생했습니다.', 'http', 500)],
    ['network', new ApiClientError('서버에 연결할 수 없습니다.', 'network')],
  ])('keeps the session and dialog after a %s withdrawal failure', async (_case, error) => {
    seedUserSession()
    deleteMemberRequest.mockRejectedValue(error)
    renderSettings()

    const dialog = openDialog('회원탈퇴')
    fireEvent.click(within(dialog).getByRole('button', { name: '회원탈퇴' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(error.message)
    await waitFor(() => expect(within(dialog).getByRole('button', { name: '회원탈퇴' })).toBeEnabled())
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBe('landlord-token')
    expect(sessionStorage.getItem('spaceup.activeRequestId')).toBe('91')
    expect(screen.queryByText('login destination')).not.toBeInTheDocument()
  })
})
