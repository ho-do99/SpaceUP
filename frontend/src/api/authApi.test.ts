import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { login } from './authApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('login API contract', () => {
  beforeEach(() => request.mockReset())

  it('does not attach authentication and unwraps the login data', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: { accessToken: 'token', memberId: 12, role: 'LANDLORD' } })
    await expect(login({ username: ' user ', password: 'pw' })).resolves.toEqual({ accessToken: 'token', memberId: 12, role: 'LANDLORD' })
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/member/login', authenticated: false,
      data: { username: 'user', password: 'pw' },
    }))
  })
})
