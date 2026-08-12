import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import { isLoginResponse } from './authApi'
import { ApiClientError, apiRequest } from './axiosInstance'
import type { ApiResponse } from '@/types/api'
import type { LoginResponse } from '@/types/auth'
import type { BusinessRegistrationVerification, MemberJoinInput } from '@/types/signup'

export async function sendJoinPhoneVerificationCode(
  phoneNumber: string,
): Promise<string> {
  const response = await apiRequest<ApiResponse<string>, { phoneNumber: string }>({
    method: 'POST',
    url: '/api/member/join/phone/verify-code/send',
    data: { phoneNumber },
    authenticated: false,
  })

  return unwrapApiResponse<string>(response, '인증번호 발송에 실패했습니다.')
}

export async function confirmJoinPhoneVerificationCode(
  phoneNumber: string,
  code: string,
): Promise<void> {
  const response = await apiRequest<ApiResponse<null>, { phoneNumber: string; code: string }>({
    method: 'POST',
    url: '/api/member/join/phone/verify-code/confirm',
    data: { phoneNumber, code },
    authenticated: false,
  })

  unwrapEmptyApiResponse(response, '휴대폰 인증에 실패했습니다.')
}

export async function joinMember(input: MemberJoinInput): Promise<LoginResponse> {
  const response = await apiRequest<ApiResponse<LoginResponse>, MemberJoinInput>({
    method: 'POST',
    url: '/api/member/join',
    data: input,
    authenticated: false,
  })

  const data = unwrapApiResponse<LoginResponse>(response, '회원가입에 실패했습니다.')
  if (!isLoginResponse(data)) {
    throw new ApiClientError('회원가입 응답을 확인할 수 없습니다.', 'invalid-response')
  }
  return data
}

export async function verifyBusinessRegistration(
  businessRegistrationNumber: string,
): Promise<BusinessRegistrationVerification> {
  const response = await apiRequest<
    ApiResponse<BusinessRegistrationVerification>,
    { businessRegistrationNumber: string }
  >({
    method: 'POST',
    url: '/api/contractors/business-registration/verify',
    data: { businessRegistrationNumber },
    authenticated: false,
  })

  return unwrapApiResponse(response, '사업자등록번호 확인에 실패했습니다.')
}

export async function uploadBusinessRegistrationCertificate(file: File): Promise<string> {
  const data = new FormData()
  data.append('file', file)
  const response = await apiRequest<ApiResponse<{ fileUrl: string }>, FormData>({
    method: 'POST',
    url: '/api/files/business-documents',
    data,
    authenticated: false,
  })

  const fileUrl = unwrapApiResponse<{ fileUrl: string }>(response, '사업자등록증 업로드에 실패했습니다.').fileUrl
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) {
    throw new ApiClientError('사업자등록증 업로드 응답을 확인할 수 없습니다.', 'invalid-response')
  }
  return fileUrl
}
