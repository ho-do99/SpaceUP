import { apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { PageResponse } from '@/types/api'
import type {
  RequestCreateInput,
  RequestImageInput,
  RequestImageResponse,
  RequestImageType,
  RequestResponse,
  RequestUpdateInput,
} from '@/types/request'

export const ACTIVE_REQUEST_ID_KEY = 'spaceup.activeRequestId'

export async function createRequest(input: RequestCreateInput) {
  const response = await apiRequest<ApiResponse<number>, RequestCreateInput>({
    method: 'POST', url: '/api/requests', data: input, authenticated: true,
  })
  return unwrapApiResponse<number>(response, '의뢰 생성에 실패했습니다.')
}

export async function getRequest(requestId: number) {
  const response = await apiRequest<ApiResponse<RequestResponse>>({
    method: 'GET', url: `/api/requests/${requestId}`, authenticated: true,
  })
  return unwrapApiResponse<RequestResponse>(response, '의뢰 조회에 실패했습니다.')
}

export async function updateRequest(requestId: number, input: RequestUpdateInput) {
  const response = await apiRequest<ApiResponse<null>, RequestUpdateInput>({
    method: 'PATCH', url: `/api/requests/${requestId}`, data: input, authenticated: true,
  })
  unwrapEmptyApiResponse(response, '의뢰 수정에 실패했습니다.')
}

export async function attachRequestImage(requestId: number, input: RequestImageInput) {
  const response = await apiRequest<ApiResponse<number>, RequestImageInput>({
    method: 'POST', url: `/api/requests/${requestId}/images`, data: input, authenticated: true,
  })
  return unwrapApiResponse<number>(response, '이미지 연결에 실패했습니다.')
}

export async function getRequestImages(requestId: number, imageType?: RequestImageType) {
  const response = await apiRequest<ApiResponse<RequestImageResponse[]>>({
    method: 'GET', url: `/api/requests/${requestId}/images`,
    params: imageType ? { imageType } : undefined, authenticated: true,
  })
  return unwrapApiResponse<RequestImageResponse[]>(response, '이미지 조회에 실패했습니다.')
}

export async function inviteContractor(requestId: number, contractorId: number) {
  await apiRequest({
    method: 'POST', url: `/api/requests/${requestId}/assign/${contractorId}`, authenticated: true,
  })
}

export async function getMyEstimateRequests(params: { page?: number; size?: number } = {}) {
  const response = await apiRequest<ApiResponse<PageResponse<RequestResponse>>>({
    method: 'GET', url: '/api/requests/landlord/me', params, authenticated: true,
  })
  return unwrapApiResponse<PageResponse<RequestResponse>>(response, '견적 요청 내역 조회에 실패했습니다.')
}
