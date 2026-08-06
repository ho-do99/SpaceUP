import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { getAssignedRequests } from './contractorApi'
import { createQuote } from './estimateApi'
import { getChatMessages } from './chatApi'
import { getVisit } from './visitApi'
import { getContractorProjects } from './projectApi'
import { getContractorReviews } from './reviewApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('contractor workflow API paths', () => {
  beforeEach(() => request.mockReset().mockResolvedValue({ success: true, message: 'ok', data: [] }))

  it('uses documented protected endpoints', async () => {
    await getAssignedRequests()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/requests/contractor/me', authenticated: true }))
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: { id: 1 } })
    await createQuote({ requestId: 7, items: [{ category: '바닥', description: '시공', amount: 1000 }] })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/quotes', method: 'POST', authenticated: true }))
    await getChatMessages(7)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/chats/7/messages' }))
    await getVisit(7)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/visits/request/7' }))
    await getContractorProjects()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/projects/contractor/me' }))
  })

  it('keeps public review reads unauthenticated', async () => {
    await getContractorReviews(2, 'five')
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/reviews/contractor/2', params: { filter: 'five' }, authenticated: false,
    }))
  })
})
