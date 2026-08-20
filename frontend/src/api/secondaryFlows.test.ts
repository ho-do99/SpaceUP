import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { getNotifications, readAllNotifications, readChatContextNotifications, readNotification } from './notificationApi'
import { getMyPortfolios, getPublicPortfolios, setPortfolioVisibility } from './portfolioApi'
import { getMySettlements } from './settlementApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('secondary workflow API paths', () => {
  beforeEach(() => request.mockReset().mockResolvedValue({ success: true, message: 'ok', data: [] }))

  it('connects notification reads and mutations', async () => {
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: { content: [] } })
    await getNotifications({ page: 1, size: 10 })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'GET', url: '/api/notifications/me', params: { page: 1, size: 10 }, authenticated: true,
    }))
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await readNotification(3)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/notifications/3/read', authenticated: true }))
    await readAllNotifications()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/notifications/read-all', authenticated: true }))
    await readChatContextNotifications(99, 5)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/notifications/chat-context/read',
      params: { requestId: 99, contractorId: 5 }, authenticated: true,
    }))
  })

  it('uses protected and public portfolio endpoints correctly', async () => {
    await getMyPortfolios()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/portfolios/me', authenticated: true }))
    await getPublicPortfolios(8)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/portfolios/contractor/8', authenticated: false }))
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: null })
    await setPortfolioVisibility(4, true)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PATCH', url: '/api/portfolios/4/visibility', params: { isPublic: true } }))
  })

  it('loads the signed-in partner settlements', async () => {
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: { content: [] } })
    await getMySettlements()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/settlements/partner/me', authenticated: true }))
  })
})
