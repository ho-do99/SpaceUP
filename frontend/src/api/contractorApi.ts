import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { AssignedRequest, Paged } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

export async function getAssignedRequests(params: { page?: number; size?: number } = {}) {
  const response = await apiRequest<ApiResponse<Paged<AssignedRequest>>>({ method: 'GET', url: '/api/requests/contractor/me', params, authenticated: true })
  return unwrapApiResponse<Paged<AssignedRequest>>(response, '의뢰 목록 조회에 실패했습니다.')
}
export async function approveRequest(id: number) {
  const response = await apiRequest<ApiResponse<RequestResponse>>({ method: 'POST', url: `/api/requests/${id}/approve`, authenticated: true })
  return unwrapApiResponse<RequestResponse>(response, '의뢰 승인에 실패했습니다.')
}
export async function rejectRequest(id: number, reason: string, detail?: string) {
  const response = await apiRequest<ApiResponse<RequestResponse>>({ method: 'POST', url: `/api/requests/${id}/reject`, data: { reason, detail }, authenticated: true })
  return unwrapApiResponse<RequestResponse>(response, '의뢰 거절에 실패했습니다.')
}
export async function getContractor(id: number) {
  const response = await apiRequest<ApiResponse<Record<string, unknown>>>({ method: 'GET', url: `/api/contractors/${id}`, authenticated: false })
  return unwrapApiResponse<Record<string, unknown>>(response, '시공사 조회에 실패했습니다.')
}
