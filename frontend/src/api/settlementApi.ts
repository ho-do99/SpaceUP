import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse, PageResponse } from '@/types/api'

export interface SettlementResponse {
  id: number
  transactionCode: string
  partnerId: number
  partnerName: string
  transactionAmount: number
  commissionAmount: number
  payoutAmount: number
  status: 'PENDING' | 'SETTLED'
}

export async function getMySettlements(params: { page?: number; size?: number } = {}) {
  const response = await apiRequest<ApiResponse<PageResponse<SettlementResponse>>>({
    method: 'GET', url: '/api/settlements/partner/me', params, authenticated: true,
  })
  return unwrapApiResponse<PageResponse<SettlementResponse>>(response, '정산 목록 조회에 실패했습니다.')
}

export async function getSettlement(id: number) {
  return unwrapApiResponse<SettlementResponse>(await apiRequest<ApiResponse<SettlementResponse>>({ method: 'GET', url: `/api/settlements/${id}`, authenticated: true }), '정산 내역 조회에 실패했습니다.')
}
