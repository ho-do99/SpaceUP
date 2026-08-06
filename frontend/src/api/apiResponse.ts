import { ApiClientError } from './axiosInstance'
import type { ApiResponse } from '@/types/api'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.success === 'boolean' &&
    typeof value.message === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  )
}

export function unwrapApiResponse<T>(
  value: unknown,
  fallbackMessage: string,
): T {
  if (!isApiResponse(value)) {
    throw new ApiClientError(
      '서버 응답을 확인할 수 없습니다.',
      'invalid-response',
    )
  }

  if (!value.success) {
    throw new ApiClientError(
      value.message.trim() || fallbackMessage,
      'business',
    )
  }

  if (value.data === null || value.data === undefined) {
    throw new ApiClientError(
      '서버 응답 데이터가 없습니다.',
      'invalid-response',
    )
  }

  return value.data as T
}
