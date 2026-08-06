import { ApiClientError, apiRequest } from './axiosInstance'
import type { ApiResponse, ImageUploadResponse } from '@/types/api'
import { getAccessToken } from '@/utils/authSession'

export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024

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

function isImageUploadResponse(
  value: unknown,
): value is ImageUploadResponse {
  return (
    isRecord(value) &&
    typeof value.imageUrl === 'string' &&
    value.imageUrl
      .trim()
      .startsWith('/api/files/images/')
  )
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return '이미지 파일만 업로드할 수 있습니다.'
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return '20MB 이하의 이미지를 선택해 주세요.'
  }

  return null
}

const uploadStatusMessages: Readonly<Record<number, string>> = {
  400: '이미지 파일만 업로드할 수 있습니다.',
  401: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  403: '이미지 업로드 권한이 없습니다.',
  500: '이미지 업로드 중 오류가 발생했습니다.',
}

export function getImageUploadErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return '이미지 업로드 중 오류가 발생했습니다.'
  }

  if (error.kind === 'network') return '서버에 연결할 수 없습니다.'
  if (error.kind === 'invalid-response') return '서버 응답을 확인할 수 없습니다.'
  if (error.kind === 'business' && error.status === 400) return error.message
  if (error.status) {
    return uploadStatusMessages[error.status] ?? '이미지 업로드 요청을 처리할 수 없습니다.'
  }
  if (error.kind === 'business') return error.message

  return error.kind === 'canceled' ? '' : '이미지 업로드 중 오류가 발생했습니다.'
}

export async function uploadImage(file: File, signal?: AbortSignal) {
  const fileError = validateImageFile(file)

  if (fileError) {
    throw new ApiClientError(fileError, 'business', 400)
  }

  if (!getAccessToken()) {
    throw new ApiClientError(
      '로그인이 만료되었습니다. 다시 로그인해 주세요.',
      'http',
      401,
    )
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await apiRequest<unknown, FormData>({
    method: 'POST',
    url: '/api/files/images',
    data: formData,
    authenticated: true,
    signal,
  })

  if (!isApiResponse(response)) {
    throw new ApiClientError('서버 응답을 확인할 수 없습니다.', 'invalid-response')
  }

  if (!response.success) {
    const message = response.message.trim() || '이미지 업로드 요청을 처리할 수 없습니다.'
    throw new ApiClientError(message, 'business')
  }

  if (!isImageUploadResponse(response.data)) {
    throw new ApiClientError('서버 응답을 확인할 수 없습니다.', 'invalid-response')
  }

  return response.data
}
