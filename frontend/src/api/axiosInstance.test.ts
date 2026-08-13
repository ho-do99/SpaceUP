import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance, { API_BASE_URL, apiRequest, normalizeRequestUrl } from './axiosInstance'
import { AUTH_SESSION_EXPIRED_EVENT, saveAuthSession } from '@/utils/authSession'

function axiosError(status: number) {
  return { isAxiosError: true, response: { status, data: null } }
}

describe('API client configuration', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

  it('uses the current backend port', () => {
    expect(API_BASE_URL).toBe('http://localhost:8090')
  })

  it('normalizes API paths without duplicating the prefix', () => {
    expect(normalizeRequestUrl('api/member/login')).toBe('/api/member/login')
    expect(normalizeRequestUrl('/api/api/member/login')).toBe('/api/member/login')
    expect(normalizeRequestUrl('https://example.com/api')).toBe('https://example.com/api')
  })

  it('clears auth and emits one expiration event for repeated authenticated 401 responses', async () => {
    saveAuthSession({ accessToken: 'token', memberId: 42, role: 'LANDLORD' })
    vi.spyOn(axiosInstance, 'request').mockRejectedValue(axiosError(401))
    const expired = vi.fn()
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)

    await expect(apiRequest({ method: 'GET', url: '/api/member/42', authenticated: true }))
      .rejects.toMatchObject({ status: 401 })
    await expect(apiRequest({ method: 'GET', url: '/api/member/42', authenticated: true }))
      .rejects.toMatchObject({ status: 401 })

    expect(sessionStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('memberId')).toBeNull()
    expect(sessionStorage.getItem('role')).toBeNull()
    expect(expired).toHaveBeenCalledOnce()
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)
  })

  it('keeps the current session and does not redirect for a public login 401', async () => {
    saveAuthSession({ accessToken: 'existing-token', memberId: 42, role: 'LANDLORD' })
    vi.spyOn(axiosInstance, 'request').mockRejectedValue(axiosError(401))
    const expired = vi.fn()
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)

    await expect(apiRequest({ method: 'POST', url: '/api/member/login', authenticated: false }))
      .rejects.toMatchObject({ status: 401 })

    expect(sessionStorage.getItem('accessToken')).toBe('existing-token')
    expect(expired).not.toHaveBeenCalled()
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expired)
  })

  it.each([403, 500, 503])('keeps auth for a non-401 HTTP %s response', async (status) => {
    saveAuthSession({ accessToken: 'token', memberId: 42, role: 'CONTRACTOR' })
    vi.spyOn(axiosInstance, 'request').mockRejectedValue(axiosError(status))

    await expect(apiRequest({ method: 'GET', url: '/api/protected', authenticated: true }))
      .rejects.toMatchObject({ status })
    expect(sessionStorage.getItem('accessToken')).toBe('token')
  })
})
