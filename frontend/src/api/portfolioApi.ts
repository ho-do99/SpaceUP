import { apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'

export interface PortfolioInput {
  projectName: string
  region: string
  propertyType: string
  areaM2: number
  workItems: string
  durationDays: number
  amount: number
  mainImageUrl: string
  photoUrls: string
  isPublic: boolean
}

export interface PortfolioResponse extends PortfolioInput { id: number; contractorId: number }

export async function createPortfolio(input: PortfolioInput) {
  const response = await apiRequest<ApiResponse<number>, PortfolioInput>({ method: 'POST', url: '/api/portfolios', data: input, authenticated: true })
  return unwrapApiResponse<number>(response, '포트폴리오 등록에 실패했습니다.')
}
export async function getMyPortfolios() {
  return unwrapApiResponse<PortfolioResponse[]>(await apiRequest<ApiResponse<PortfolioResponse[]>>({ method: 'GET', url: '/api/portfolios/me', authenticated: true }), '포트폴리오 목록 조회에 실패했습니다.')
}
export async function getPortfolio(id: number) {
  return unwrapApiResponse<PortfolioResponse>(await apiRequest<ApiResponse<PortfolioResponse>>({ method: 'GET', url: `/api/portfolios/${id}`, authenticated: false }), '포트폴리오 조회에 실패했습니다.')
}
export async function getPublicPortfolios(contractorId: number) {
  return unwrapApiResponse<PortfolioResponse[]>(await apiRequest<ApiResponse<PortfolioResponse[]>>({ method: 'GET', url: `/api/portfolios/contractor/${contractorId}`, authenticated: false }), '포트폴리오 목록 조회에 실패했습니다.')
}
export async function updatePortfolio(id: number, input: PortfolioInput) {
  const response = await apiRequest<ApiResponse<null>, PortfolioInput>({ method: 'PUT', url: `/api/portfolios/${id}`, data: input, authenticated: true })
  return unwrapEmptyApiResponse(response, '포트폴리오 수정에 실패했습니다.')
}
export async function deletePortfolio(id: number) {
  return unwrapEmptyApiResponse(await apiRequest<ApiResponse<null>>({ method: 'DELETE', url: `/api/portfolios/${id}`, authenticated: true }), '포트폴리오 삭제에 실패했습니다.')
}
export async function setPortfolioVisibility(id: number, isPublic: boolean) {
  return unwrapEmptyApiResponse(await apiRequest<ApiResponse<null>>({ method: 'PATCH', url: `/api/portfolios/${id}/visibility`, params: { isPublic }, authenticated: true }), '포트폴리오 공개 설정 변경에 실패했습니다.')
}
