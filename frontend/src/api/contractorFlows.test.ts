import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { approveRequest, getAssignedRequests, rejectRequest } from './contractorApi'
import { createQuote, submitQuote, updateQuote } from './estimateApi'
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
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: 1 })
    await expect(createQuote({ requestId: 7, items: [{ category: '바닥', description: '시공', amount: 1000 }] })).resolves.toBe(1)
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

  it('updates one draft and accepts an empty submit response', async () => {
    const input = { requestId: 7, items: [{ category: '바닥', amount: 1000 }] }
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await expect(updateQuote(1, input)).resolves.toBeUndefined()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PATCH', url: '/api/quotes/1' }))
    await expect(submitQuote(1)).resolves.toBeUndefined()
  })

  it('accepts empty success payloads for request decisions', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await expect(approveRequest(7)).resolves.toBeUndefined()
    await expect(rejectRequest(8, 'SCHEDULE_CONFLICT')).resolves.toBeUndefined()
  })
})
