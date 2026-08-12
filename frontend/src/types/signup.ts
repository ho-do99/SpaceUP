import type { MemberRole } from './member'

export interface MemberJoinInput {
  role: Exclude<MemberRole, 'ADMIN'>
  password: string
  email: string
  name: string
  phoneNumber: string
}

export type PhoneVerificationState =
  | 'idle'
  | 'sent'
  | 'verifying'
  | 'verified'
  | 'failed'
  | 'expired'

export interface ContractorCompanySignupInput {
  companyName: string
  representativeName: string
  companyAddress: string
  regions: string[]
  specialties: string[]
  constructionExperienceMonths: string
  introduction: string
}

export interface ContractorBusinessSignupInput {
  businessRegistrationNumber: string
  businessName: string
  representativeName: string
  businessAddress: string
  registrationDocument: File | null
  submissionAgreed: boolean
}

export interface ContractorProfileSignupPayload {
  businessRegistrationNumber: string
  representativeName: string
  businessRegistrationCertificateUrl: string
  companyName: string
  companyAddress: string
  businessAddress: string
  constructionExperienceMonths: number
  activityRegions: string
  specialties: string
  introduction: string
}

export interface BusinessRegistrationVerification {
  valid: boolean
  businessRegistrationNumber: string
  message: string
}
