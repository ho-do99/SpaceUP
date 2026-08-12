import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './axiosInstance'
import {
  confirmJoinPhoneVerificationCode,
  joinMember,
  sendJoinPhoneVerificationCode,
  uploadBusinessRegistrationCertificate,
  verifyBusinessRegistration,
} from './signupApi'

vi.mock('./axiosInstance', async () => {
  const actual = await vi.importActual<typeof import('./axiosInstance')>('./axiosInstance')
  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

describe('signup public API contract', () => {
  beforeEach(() => request.mockReset())

  it('sends the phone number to the public join verification endpoint without JWT', async () => {
    request.mockResolvedValue({ success: true, message: 'sent', data: '123456' })
    await expect(sendJoinPhoneVerificationCode('010-1234-5678')).resolves.toBe('123456')
    expect(request).toHaveBeenCalledWith({ method: 'POST', url: '/api/member/join/phone/verify-code/send', data: { phoneNumber: '010-1234-5678' }, authenticated: false })
  })

  it('confirms with only phoneNumber and code on the public endpoint', async () => {
    request.mockResolvedValue({ success: true, message: 'verified', data: null })
    await confirmJoinPhoneVerificationCode('010-1234-5678', '123456')
    expect(request).toHaveBeenCalledWith({ method: 'POST', url: '/api/member/join/phone/verify-code/confirm', data: { phoneNumber: '010-1234-5678', code: '123456' }, authenticated: false })
  })

  it('sends no username and unwraps the join authentication data', async () => {
    const auth = { accessToken: 'join-token', memberId: 31, role: 'LANDLORD' as const }
    request.mockResolvedValue({ success: true, message: 'joined', data: auth })
    const input = { role: 'LANDLORD' as const, password: 'Test1234!', email: 'user@spaceup.co.kr', name: '홍길동', phoneNumber: '010-1234-5678' }
    await expect(joinMember(input)).resolves.toEqual(auth)
    expect(request).toHaveBeenCalledWith({ method: 'POST', url: '/api/member/join', data: input, authenticated: false })
    expect(input).not.toHaveProperty('username')
  })

  it('uses the public business registration verification contract', async () => {
    const result = { valid: true, businessRegistrationNumber: '220-81-62517', message: 'ok' }
    request.mockResolvedValue({ success: true, message: 'verified', data: result })
    await expect(verifyBusinessRegistration('220-81-62517')).resolves.toEqual(result)
    expect(request).toHaveBeenCalledWith({ method: 'POST', url: '/api/contractors/business-registration/verify', data: { businessRegistrationNumber: '220-81-62517' }, authenticated: false })
  })

  it('uploads the certificate as public multipart field file and returns fileUrl', async () => {
    request.mockResolvedValue({ success: true, message: 'uploaded', data: { fileUrl: '/api/files/business-documents/certificate.pdf' } })
    const file = new File(['document'], 'certificate.pdf', { type: 'application/pdf' })
    await expect(uploadBusinessRegistrationCertificate(file)).resolves.toBe('/api/files/business-documents/certificate.pdf')
    const config = request.mock.calls[0][0]
    expect(config).toMatchObject({ method: 'POST', url: '/api/files/business-documents', authenticated: false })
    expect(config.data).toBeInstanceOf(FormData)
    expect((config.data as FormData).get('file')).toBe(file)
  })
})
