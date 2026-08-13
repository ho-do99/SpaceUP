import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireRole, { AuthSessionExpirationHandler } from './RequireRole'
import { AUTH_SESSION_EXPIRED_EVENT } from '@/utils/authSession'

function seedSession(role: string) {
  sessionStorage.setItem('accessToken', 'token')
  sessionStorage.setItem('memberId', '42')
  sessionStorage.setItem('role', role)
}

function renderGuard(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthSessionExpirationHandler />
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route element={<RequireRole role="LANDLORD" />}>
          <Route path="/landlord" element={<p>landlord page</p>} />
        </Route>
        <Route element={<RequireRole role="CONTRACTOR" />}>
          <Route path="/contractor" element={<p>contractor page</p>} />
        </Route>
        <Route path="/" element={<p>landlord home</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => { cleanup(); sessionStorage.clear() })

  it.each(['/landlord', '/contractor'])('redirects an unauthenticated protected route to login', (path) => {
    renderGuard(path)
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('allows LANDLORD from sessionStorage and redirects it away from contractor routes', () => {
    seedSession('LANDLORD')
    const view = renderGuard('/landlord')
    expect(screen.getByText('landlord page')).toBeInTheDocument()
    view.unmount()

    renderGuard('/contractor')
    expect(screen.getByText('landlord home')).toBeInTheDocument()
  })

  it('allows CONTRACTOR from sessionStorage and redirects it away from landlord routes', () => {
    seedSession('CONTRACTOR')
    const view = renderGuard('/contractor')
    expect(screen.getByText('contractor page')).toBeInTheDocument()
    view.unmount()

    renderGuard('/landlord')
    expect(screen.getByText('contractor page')).toBeInTheDocument()
  })

  it.each(['UNKNOWN', 'ADMIN'])('clears unsupported role %s and redirects to login', (role) => {
    seedSession(role)
    renderGuard('/landlord')
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('memberId')).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
  })

  it('replaces the current protected page when an auth expiration event is emitted', async () => {
    seedSession('LANDLORD')
    renderGuard('/landlord')
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })
})
