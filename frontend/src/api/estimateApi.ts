import { apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { QuoteInput, QuoteResponse } from '@/types/backendContractor'

export async function createQuote(input: QuoteInput) { const r = await apiRequest<ApiResponse<number>, QuoteInput>({ method: 'POST', url: '/api/quotes', data: input, authenticated: true }); return unwrapApiResponse<number>(r, '견적 저장에 실패했습니다.') }
export async function updateQuote(id: number, input: QuoteInput) { const r = await apiRequest<ApiResponse<null>, QuoteInput>({ method: 'PATCH', url: `/api/quotes/${id}`, data: input, authenticated: true }); unwrapEmptyApiResponse(r, '견적 수정에 실패했습니다.') }
export async function getQuote(id: number) { const r = await apiRequest<ApiResponse<QuoteResponse>>({ method: 'GET', url: `/api/quotes/${id}`, authenticated: true }); return unwrapApiResponse<QuoteResponse>(r, '견적 조회에 실패했습니다.') }
export async function submitQuote(id: number) { const r = await apiRequest<ApiResponse<null>>({ method: 'POST', url: `/api/quotes/${id}/submit`, authenticated: true }); unwrapEmptyApiResponse(r, '견적 발송에 실패했습니다.') }
export async function getQuotesByRequest(requestId: number) { const r = await apiRequest<ApiResponse<QuoteResponse[]>>({ method: 'GET', url: `/api/quotes/request/${requestId}`, authenticated: true }); return unwrapApiResponse<QuoteResponse[]>(r, '견적 목록 조회에 실패했습니다.') }
export async function acceptQuote(id: number) { await apiRequest({ method: 'POST', url: `/api/quotes/${id}/accept`, authenticated: true }) }
export async function rejectQuote(id: number) { await apiRequest({ method: 'POST', url: `/api/quotes/${id}/reject`, authenticated: true }) }
