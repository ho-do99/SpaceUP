import { apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { AssignedRequest, ContractorDashboard, ContractorProfile, RecommendedContractor } from '@/types/backendContractor'
import type { PageResponse } from '@/types/api'

export async function getAssignedRequests(params: { page?: number; size?: number } = {}) {
  const response = await apiRequest<ApiResponse<PageResponse<AssignedRequest>>>({ method: 'GET', url: '/api/requests/contractor/me', params, authenticated: true })
  return unwrapApiResponse<PageResponse<AssignedRequest>>(response, '의뢰 목록 조회에 실패했습니다.')
}
export async function approveRequest(id: number) {
  const response = await apiRequest<ApiResponse<null>>({ method: 'POST', url: `/api/requests/${id}/approve`, authenticated: true })
  unwrapEmptyApiResponse(response, '의뢰 승인에 실패했습니다.')
}
export async function rejectRequest(id: number, reason: string, detail?: string) {
  const response = await apiRequest<ApiResponse<null>>({ method: 'POST', url: `/api/requests/${id}/reject`, data: { reason, detail }, authenticated: true })
  unwrapEmptyApiResponse(response, '의뢰 거절에 실패했습니다.')
}
export async function getContractor(id: number) {
  const response = await apiRequest<ApiResponse<ContractorProfile>>({ method: 'GET', url: `/api/contractors/${id}`, authenticated: false })
  return unwrapApiResponse<ContractorProfile>(response, '시공사 조회에 실패했습니다.')
}
export async function getMyContractorProfile() {
  const response = await apiRequest<ApiResponse<ContractorProfile>>({ method: 'GET', url: '/api/contractors/me', authenticated: true })
  return unwrapApiResponse<ContractorProfile>(response, '시공사 프로필 조회에 실패했습니다.')
}
export async function getRecommendedContractors(requestId: number) {
  const response = await apiRequest<ApiResponse<RecommendedContractor[]>>({
    method: 'GET', url: `/api/requests/${requestId}/recommended-contractors`, authenticated: true,
  })
  return unwrapApiResponse<RecommendedContractor[]>(response, '추천 시공사 조회에 실패했습니다.')
}
export async function getContractorDashboard() {
  const response = await apiRequest<ApiResponse<ContractorDashboard>>({ method: 'GET', url: '/api/contractors/me/dashboard', authenticated: true })
  return unwrapApiResponse<ContractorDashboard>(response, '대시보드 조회에 실패했습니다.')
}

export interface ContractorProfileUpdateInput {
  businessRegistrationNumber?: string
  companyName?: string
  activityRegions?: string
  specialties?: string
  portfolioUrl?: string
  introduction?: string
}

export interface ContractorManagerUpdateInput {
  managerPosition?: string
  consultationHours?: string
}

export interface ContractorDisclosureUpdateInput {
  profilePublic: boolean
  contactPublic: boolean
  specialtyPublic: boolean
  regionPublic: boolean
  portfolioPublic: boolean
  availableForConsult: boolean
}

export async function updateMyContractorProfile(input: ContractorProfileUpdateInput) {
  const response = await apiRequest<ApiResponse<null>, ContractorProfileUpdateInput>({ method: 'PUT', url: '/api/contractors/me', data: input, authenticated: true })
  unwrapEmptyApiResponse(response, '시공사 프로필 저장에 실패했습니다.')
}

export async function updateMyContractorManager(input: ContractorManagerUpdateInput) {
  const response = await apiRequest<ApiResponse<null>, ContractorManagerUpdateInput>({ method: 'PUT', url: '/api/contractors/me/manager', data: input, authenticated: true })
  unwrapEmptyApiResponse(response, '담당자 정보 저장에 실패했습니다.')
}

export async function updateMyContractorDisclosure(input: ContractorDisclosureUpdateInput) {
  const response = await apiRequest<ApiResponse<null>, ContractorDisclosureUpdateInput>({ method: 'PUT', url: '/api/contractors/me/disclosure', data: input, authenticated: true })
  unwrapEmptyApiResponse(response, '업체 공개 설정 저장에 실패했습니다.')
}
