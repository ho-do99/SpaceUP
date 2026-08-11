import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { approveRequest, getAssignedRequests, rejectRequest, updateMyContractorDisclosure, updateMyContractorManager, updateMyContractorProfile, updateMyContractorServiceInfo } from './contractorApi'
import { createQuote, extendQuote, requestQuoteRevision, submitQuote } from './estimateApi'
import { getChatMessages } from './chatApi'
import { getVisit, requestVisitChange } from './visitApi'
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

  it('extends and submits a quote through the documented action routes', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await expect(extendQuote(37, '2026-12-31', '사용자 확인 기간 연장')).resolves.toBeUndefined()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/quotes/37/extend',
      data: { newValidUntil: '2026-12-31', memo: '사용자 확인 기간 연장' },
    }))
    await expect(submitQuote(1)).resolves.toBeUndefined()
  })

  it('uses the visit response id and documented change request body', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: { id: 55, requestId: 17, status: 'CHANGE_REQUESTED' } })
    await requestVisitChange(55, {
      requestedDate: '2026-08-20', requestedTime: '14:00:00', reason: '일정 조정이 필요합니다.',
    })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({
      method: 'POST', url: '/api/visits/55/change-request',
      data: { requestedDate: '2026-08-20', requestedTime: '14:00:00', reason: '일정 조정이 필요합니다.' },
    }))
  })

  it('accepts empty success payloads for request decisions', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await expect(approveRequest(7)).resolves.toBeUndefined()
    await expect(rejectRequest(8, 'SCHEDULE_CONFLICT')).resolves.toBeUndefined()
  })

  it('sends only confirmed contractor profile, manager and disclosure fields', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await updateMyContractorProfile({ activityRegions: '광주광역시,전라남도', specialties: '도배,장판·마루' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PUT', url: '/api/contractors/me', data: { activityRegions: '광주광역시,전라남도', specialties: '도배,장판·마루' } }))
    await updateMyContractorManager({ managerPosition: '팀장', consultationHours: '평일 09:00-18:00' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/contractors/me/manager', data: { managerPosition: '팀장', consultationHours: '평일 09:00-18:00' } }))
    const disclosure = { profilePublic: true, contactPublic: false, specialtyPublic: true, regionPublic: true, portfolioPublic: false, availableForConsult: true }
    await updateMyContractorDisclosure(disclosure)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/contractors/me/disclosure', data: disclosure }))
  })

  it('uses note as the quote revision request field', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await requestQuoteRevision(33, { note: '자재비를 확인해주세요.', targetItemIds: [12], requestedAmount: 4_500_000 })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/quotes/33/request-revision', data: { note: '자재비를 확인해주세요.', targetItemIds: [12], requestedAmount: 4_500_000 } }))
  })

  it('saves validated contractor service information only', async () => {
    request.mockResolvedValue({ success: true, message: 'ok', data: null })
    await updateMyContractorServiceInfo({ estimateMin: 1_000_000, estimateMax: 5_000_000, availableFromDate: '2026-08-20' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PUT', url: '/api/contractors/me/service-info', data: { estimateMin: 1_000_000, estimateMax: 5_000_000, availableFromDate: '2026-08-20' } }))
    request.mockClear()
    await expect(updateMyContractorServiceInfo({ estimateMin: 5_000_000, estimateMax: 1_000_000, availableFromDate: '' })).rejects.toThrow()
    expect(request).not.toHaveBeenCalled()
  })

  it('does not send an empty quote revision note', async () => {
    request.mockClear()
    await expect(requestQuoteRevision(33, { note: '   ' })).rejects.toThrow()
    expect(request).not.toHaveBeenCalled()
  })
})
