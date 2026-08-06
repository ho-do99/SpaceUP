import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { QuoteInput, QuoteResponse } from '@/types/backendContractor'

export async function createQuote(input: QuoteInput) { const r = await apiRequest<ApiResponse<QuoteResponse>, QuoteInput>({ method: 'POST', url: '/api/quotes', data: input, authenticated: true }); return unwrapApiResponse<QuoteResponse>(r, '견적 저장에 실패했습니다.') }
export async function getQuote(id: number) { const r = await apiRequest<ApiResponse<QuoteResponse>>({ method: 'GET', url: `/api/quotes/${id}`, authenticated: true }); return unwrapApiResponse<QuoteResponse>(r, '견적 조회에 실패했습니다.') }
export async function submitQuote(id: number) { const r = await apiRequest<ApiResponse<QuoteResponse>>({ method: 'POST', url: `/api/quotes/${id}/submit`, authenticated: true }); return unwrapApiResponse<QuoteResponse>(r, '견적 발송에 실패했습니다.') }
