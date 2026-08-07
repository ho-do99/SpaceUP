import { apiRequest } from './axiosInstance'; import { unwrapApiResponse } from './apiResponse'; import type { ApiResponse } from '@/types/api'; import type { SiteVisit } from '@/types/backendContractor'
const action = async (url: string, data?: unknown) => unwrapApiResponse<SiteVisit>(await apiRequest<ApiResponse<SiteVisit>>({ method: 'POST', url, data, authenticated: true }), '방문 일정 처리에 실패했습니다.')
export async function getVisit(id: number) { return unwrapApiResponse<SiteVisit>(await apiRequest<ApiResponse<SiteVisit>>({ method: 'GET', url: `/api/visits/request/${id}`, authenticated: true }), '방문 일정 조회에 실패했습니다.') }
export const registerVisit = (id: number, data: unknown) => action(`/api/visits/request/${id}/register`, data)
export const acceptVisitChange = (id: number) => action(`/api/visits/${id}/accept-change`)
export const proposeVisitChange = (id: number, data: unknown) => action(`/api/visits/${id}/propose`, data)
export const rejectVisitChange = (id: number) => action(`/api/visits/${id}/reject-change`)
export const completeVisit = (id: number, note?: string) => action(`/api/visits/${id}/complete`, note ? { note } : undefined)
