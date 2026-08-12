import type {
  ContractorBusinessSignupInput,
  ContractorCompanySignupInput,
  ContractorProfileSignupPayload,
} from '@/types/signup'

export const PHONE_PATTERN = /^01\d-\d{3,4}-\d{4}$/
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,16}$/

export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function formatRemainingTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function buildContractorProfileSignupPayload(
  company: ContractorCompanySignupInput,
  business: ContractorBusinessSignupInput,
  businessRegistrationCertificateUrl: string,
): ContractorProfileSignupPayload {
  const constructionExperienceMonths = parseConstructionExperienceMonths(company.constructionExperienceMonths)
  if (constructionExperienceMonths === null) {
    throw new Error('시공 경력은 0 이상의 정수 개월 수로 입력해 주세요.')
  }

  return {
    businessRegistrationNumber: business.businessRegistrationNumber.trim(),
    representativeName: business.representativeName.trim(),
    businessRegistrationCertificateUrl,
    companyName: business.businessName.trim(),
    companyAddress: company.companyAddress.trim(),
    businessAddress: business.businessAddress.trim(),
    constructionExperienceMonths,
    activityRegions: company.regions.join(','),
    specialties: company.specialties.join(','),
    introduction: company.introduction.trim(),
  }
}

export function parseConstructionExperienceMonths(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const months = Number(trimmed)
  return Number.isSafeInteger(months) ? months : null
}

export function validateBusinessRegistrationFile(file: File): string | null {
  const supportedTypes = ['image/jpeg', 'image/png', 'application/pdf']
  if (!supportedTypes.includes(file.type)) {
    return 'JPG, PNG, PDF 파일만 선택할 수 있습니다.'
  }
  if (file.size > 10 * 1024 * 1024) {
    return '사업자등록증은 최대 10MB까지 첨부할 수 있습니다.'
  }
  return null
}
