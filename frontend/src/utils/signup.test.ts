import { describe, expect, it } from 'vitest'
import { buildContractorProfileSignupPayload, formatPhoneNumber, parseConstructionExperienceYears, validateBusinessRegistrationFile } from './signup'

describe('signup helpers', () => {
  it('formats phone input without inventing digits', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678')
  })

  it('maps region and specialty chips to comma-separated backend fields only', () => {
    const payload = buildContractorProfileSignupPayload(
      { companyName: '스페이스업 인테리어', representativeName: '초기 대표', companyAddress: '광주 북구', regions: ['광주 전체', '전남'], specialties: ['벽지', '조명'], experience: '10', introduction: '소개' },
      { businessRegistrationNumber: '123-45-67890', businessName: '최종 상호', representativeName: '최종 대표', businessAddress: '광주 서구', registrationDocument: null, submissionAgreed: true },
      '/api/files/business-documents/license.pdf',
    )
    expect(payload).toEqual({ businessRegistrationNumber: '123-45-67890', representativeName: '최종 대표', businessRegistrationCertificateUrl: '/api/files/business-documents/license.pdf', companyName: '최종 상호', companyAddress: '광주 북구', businessAddress: '광주 서구', constructionExperienceYears: 10, activityRegions: '광주 전체,전남', specialties: '벽지,조명', introduction: '소개' })
  })

  it('accepts only a direct non-negative integer year value', () => {
    expect(parseConstructionExperienceYears('10')).toBe(10)
    expect(parseConstructionExperienceYears('10년')).toBeNull()
  })

  it('accepts only JPG, PNG, PDF up to 10MB', () => {
    expect(validateBusinessRegistrationFile(new File(['ok'], 'license.pdf', { type: 'application/pdf' }))).toBeNull()
    expect(validateBusinessRegistrationFile(new File(['bad'], 'license.txt', { type: 'text/plain' }))).toContain('JPG')
    const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'license.png', { type: 'image/png' })
    expect(validateBusinessRegistrationFile(oversized)).toContain('10MB')
  })
})
