import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AppRouter from './AppRouter'

vi.mock('@/pages/HomePage', () => ({ default: () => <p>사용자 홈</p> }))
vi.mock('@/pages/LoginPage', () => ({ default: () => <p>로그인 화면</p> }))
vi.mock('@/pages/signup/LandlordSignupPage', () => ({ default: () => <p>사용자 회원가입</p> }))
vi.mock('@/pages/signup/ContractorSignupPage', () => ({ default: () => <p>시공사 회원가입</p> }))

describe('AppRouter initial landing gate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.history.replaceState({}, '', '/')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('memberId')
    sessionStorage.removeItem('role')
  })

  afterEach(() => {
    cleanup()
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('memberId')
    sessionStorage.removeItem('role')
    vi.useRealTimers()
  })

  it('shows the splash only for an unauthenticated initial root entry', () => {
    render(<AppRouter />)
    expect(screen.getByRole('heading', { name: 'SpaceUP' })).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  it('renders HomePage immediately when an existing access token is present at root', () => {
    sessionStorage.setItem('accessToken', 'existing-access-token')
    sessionStorage.setItem('memberId', '1')
    sessionStorage.setItem('role', 'LANDLORD')
    render(<AppRouter />)

    expect(screen.getByText('사용자 홈')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'SpaceUP' })).not.toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(window.location.pathname).toBe('/')
    expect(screen.getByText('사용자 홈')).toBeInTheDocument()
  })

  it.each([
    ['/login', '로그인 화면'],
    ['/signup/landlord', '사용자 회원가입'],
    ['/signup/contractor', '시공사 회원가입'],
  ])('keeps public route %s accessible without authentication', (path, content) => {
    window.history.replaceState({}, '', path)
    render(<AppRouter />)
    expect(screen.getByText(content)).toBeInTheDocument()
  })
})
