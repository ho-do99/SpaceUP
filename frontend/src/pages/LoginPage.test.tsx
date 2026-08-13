import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { login } from '@/api/authApi'
import LoginPage from './LoginPage'

vi.mock('@/api/authApi', () => ({ login: vi.fn() }))

const loginMock = vi.mocked(login)

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>사용자 홈</p>} />
        <Route path="/contractor" element={<p>시공사 홈</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function submitCredentials() {
  fireEvent.change(screen.getByLabelText('이메일'), {
    target: { value: 'member@spaceup.co.kr' },
  })
  fireEvent.change(screen.getByLabelText('비밀번호'), {
    target: { value: 'Spaceup!2026' },
  })
  fireEvent.click(screen.getByRole('button', { name: '로그인' }))
}

describe('LoginPage role selection', () => {
  beforeEach(() => {
    loginMock.mockReset()
    sessionStorage.clear()
  })

  afterEach(cleanup)

  it('blocks a contractor account when the user login type is selected', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'contractor-token',
      memberId: 61,
      role: 'CONTRACTOR',
    })
    renderLoginPage()

    submitCredentials()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '선택한 로그인 유형과 계정 유형이 일치하지 않습니다.',
    )
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(screen.queryByText('시공사 홈')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('blocks a landlord account when the contractor login type is selected', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'landlord-token',
      memberId: 62,
      role: 'LANDLORD',
    })
    renderLoginPage()
    fireEvent.click(screen.getByRole('radio', { name: '시공사' }))

    submitCredentials()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '선택한 로그인 유형과 계정 유형이 일치하지 않습니다.',
    )
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(screen.queryByText('사용자 홈')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument()
  })

  it('logs a landlord into the user home when the selected type matches', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'landlord-token',
      memberId: 63,
      role: 'LANDLORD',
    })
    renderLoginPage()

    submitCredentials()

    expect(await screen.findByText('사용자 홈')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBe('landlord-token')
    expect(sessionStorage.getItem('role')).toBe('LANDLORD')
  })

  it('logs a contractor into the contractor home when the selected type matches', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'contractor-token',
      memberId: 64,
      role: 'CONTRACTOR',
    })
    renderLoginPage()
    fireEvent.click(screen.getByRole('radio', { name: '시공사' }))

    submitCredentials()

    expect(await screen.findByText('시공사 홈')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBe('contractor-token')
    expect(sessionStorage.getItem('role')).toBe('CONTRACTOR')
  })

  it('does not show an administrator login entry', () => {
    renderLoginPage()

    expect(screen.queryByText('관리자 로그인')).not.toBeInTheDocument()
  })

  it('clears a role mismatch error when the login type changes', async () => {
    loginMock.mockResolvedValue({
      accessToken: 'contractor-token',
      memberId: 65,
      role: 'CONTRACTOR',
    })
    renderLoginPage()
    submitCredentials()
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('radio', { name: '시공사' }))

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})
