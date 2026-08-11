import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { inviteContractor } from './requestApi'
import { acceptQuote, getQuotesByRequest } from './estimateApi'
import { getChatMessages, sendChatMessage } from './chatApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('multi-contractor quote flow API compatibility', () => {
  beforeEach(() => request.mockReset().mockResolvedValue({ success: true, message: 'ok', data: [] }))

  it('invites multiple contractors through the existing assignment route', async () => {
    await inviteContractor(7, 20)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/requests/7/assign/20', authenticated: true,
    }))
  })

  it('loads all quotes and selects one quote', async () => {
    await getQuotesByRequest(7)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/quotes/request/7' }))
    await acceptQuote(100)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/quotes/100/accept' }))
  })

  it('uses request-scoped chat routes and omits contractorId when not supplied', async () => {
    await getChatMessages(7)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'GET', url: '/api/chats/7/messages' }))
    expect(request.mock.calls.at(-1)?.[0]).toHaveProperty('params', undefined)
    await sendChatMessage(7, 'hello')
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/chats/7/messages', data: { content: 'hello' } }))
    expect(request.mock.calls.at(-1)?.[0]).toHaveProperty('params', undefined)
  })
})
