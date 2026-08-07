import { ApiClientError, apiRequest } from './axiosInstance'
import type { ApiResponse } from '@/types/api'
import type { LoginRequest, LoginResponse, UserRole } from '@/types/auth'

const userRoles: readonly UserRole[] = [
  'LANDLORD',
  'CONTRACTOR',
  'ADMIN',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && userRoles.some((role) => role === value)
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.success === 'boolean' &&
    typeof value.message === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return (
    isRecord(value) &&
    typeof value.accessToken === 'string' &&
    Boolean(value.accessToken.trim()) &&
    typeof value.memberId === 'number' &&
    Number.isFinite(value.memberId) &&
    value.memberId > 0 &&
    isUserRole(value.role)
  )
}

export async function login(
  request: LoginRequest,
  signal?: AbortSignal,
): Promise<LoginResponse> {
  const response = await apiRequest<unknown, LoginRequest>({
    method: 'POST',
    url: '/api/member/login',
    data: {
      username: request.username.trim(),
      password: request.password,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    authenticated: false,
    signal,
  })

  if (!isApiResponse(response)) {
    throw new ApiClientError('서버 응답을 확인할 수 없습니다.', 'invalid-response')
  }

  if (!response.success) {
    const message = response.message.trim() || '로그인에 실패했습니다.'
    throw new ApiClientError(message, 'business')
  }

  if (!isLoginResponse(response.data)) {
    throw new ApiClientError('서버 응답을 확인할 수 없습니다.', 'invalid-response')
  }

  return response.data
}
