import { apiRequest } from './axiosInstance'; import { unwrapApiResponse } from './apiResponse'; import type { ApiResponse } from '@/types/api'; import type { SiteVisit, VisitChangeRequestInput, VisitScheduleInput } from '@/types/backendContractor'
const action = async <TBody = undefined>(url: string, data?: TBody) => unwrapApiResponse<SiteVisit>(await apiRequest<ApiResponse<SiteVisit>, TBody>({ method: 'POST', url, data, authenticated: true }), '방문 일정 처리에 실패했습니다.')
export async function getVisit(id: number, contractorId?: number) { return unwrapApiResponse<SiteVisit>(await apiRequest<ApiResponse<SiteVisit>>({ method: 'GET', url: `/api/visits/request/${id}`, params: contractorId ? { contractorId } : undefined, authenticated: true }), '방문 일정 조회에 실패했습니다.') }
export const registerVisit = (id: number, data: VisitScheduleInput) => action(`/api/visits/request/${id}/register`, data)
export const requestVisitChange = (id: number, data: VisitChangeRequestInput) => action(`/api/visits/${id}/change-request`, data)
export const acceptVisitChange = (id: number) => action(`/api/visits/${id}/accept-change`)
export const proposeVisitChange = (id: number, data: VisitScheduleInput) => action(`/api/visits/${id}/propose`, data)
export const rejectVisitChange = (id: number) => action(`/api/visits/${id}/reject-change`)
export const completeVisit = (id: number, note?: string) => action(`/api/visits/${id}/complete`, note ? { note } : undefined)
