import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import { confirmEmailVerificationCode, sendEmailVerificationCode, updateMember, updateMyPassword, updateMyPhoneNumber } from './memberApi'
import { confirmAndRefreshProject, getLandlordProjects, getProject } from './projectApi'
import { createReview } from './reviewApi'

vi.mock('./axiosInstance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./axiosInstance')>()
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('2026-08-11 confirmed contracts', () => {
  beforeEach(() => request.mockReset().mockResolvedValue({ success: true, message: 'ok', data: null }))

  it('updates email with the current name and performs the two authenticated verification calls', async () => {
    await updateMember(12, { email: 'new@example.com', name: '장지선' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PUT', url: '/api/member/12', data: { email: 'new@example.com', name: '장지선' } }))
    await sendEmailVerificationCode()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/member/me/email/verify-code/send', authenticated: true }))
    await confirmEmailVerificationCode('123456')
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'POST', url: '/api/member/me/email/verify-code/confirm', data: { code: '123456' }, authenticated: true }))
  })

  it('changes the current member phone and password with exact bodies', async () => {
    await updateMyPhoneNumber('010-1234-5678')
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PATCH', url: '/api/member/me/phone', data: { phoneNumber: '010-1234-5678' }, authenticated: true }))
    await updateMyPassword({ currentPassword: 'current-secret', newPassword: 'new-secret' })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'PATCH', url: '/api/member/me/password', data: { currentPassword: 'current-secret', newPassword: 'new-secret' }, authenticated: true }))
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ newPasswordConfirm: expect.anything() }) }))
  })

  it('uses project.id for detail and project.requestId for review creation', async () => {
    const project = { id: 7, requestId: 21, quoteId: 33, contractorId: 5, status: 'COMPLETED' as const }
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: [project] })
    const projects = await getLandlordProjects()
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/projects/landlord/me' }))
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: project })
    await getProject(projects[0].id)
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/projects/7' }))
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: { id: 1 } })
    await createReview(projects[0].requestId, { rating: 5, content: '좋아요', keywords: ['SCHEDULE_KEPT'] })
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ url: '/api/reviews/request/21', data: { rating: 5, content: '좋아요', keywords: ['SCHEDULE_KEPT'] } }))
  })

  it('confirms completion with project.id and refreshes the project', async () => {
    const completionRequested = { id: 7, requestId: 21, quoteId: 33, contractorId: 5, status: 'COMPLETION_REQUESTED' as const }
    const completed = { ...completionRequested, status: 'COMPLETED' as const }
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: completed })
    request.mockResolvedValueOnce({ success: true, message: 'ok', data: completed })
    await expect(confirmAndRefreshProject(completionRequested.id)).resolves.toEqual(completed)
    expect(request).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'POST', url: '/api/projects/7/confirm-completion' }))
    expect(request).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'GET', url: '/api/projects/7' }))

    request.mockReset().mockRejectedValueOnce(new Error('failed'))
    await expect(confirmAndRefreshProject(completionRequested.id)).rejects.toThrow('failed')
    expect(request).toHaveBeenCalledTimes(1)
  })
})
