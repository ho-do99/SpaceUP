import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type {
  AnalysisJobResponse,
  AnalysisSpaceInput,
  AnalysisSpaceResponse,
  RecommendedProduct,
} from '@/types/analysis'

export async function getAnalysis(requestId: number) {
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>>({
    method: 'GET', url: `/api/analysis/request/${requestId}`, authenticated: true,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '분석 조회에 실패했습니다.')
}

export async function scanFloorPlan(requestId: number, file: File) {
  const data = new FormData()
  data.append('file', file)
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>, FormData>({
    method: 'POST', url: `/api/analysis/request/${requestId}/floorplan-scan`, data, authenticated: true,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '평면도 분석에 실패했습니다.')
}

export async function replaceAnalysisSpaces(requestId: number, spaces: AnalysisSpaceInput[]) {
  const response = await apiRequest<ApiResponse<AnalysisSpaceResponse[]>, AnalysisSpaceInput[]>({
    method: 'PUT', url: `/api/analysis/request/${requestId}/spaces`, data: spaces, authenticated: true,
  })
  return unwrapApiResponse<AnalysisSpaceResponse[]>(response, '공간 저장에 실패했습니다.')
}

export async function getAnalysisSpaces(requestId: number) {
  const response = await apiRequest<ApiResponse<AnalysisSpaceResponse[]>>({
    method: 'GET', url: `/api/analysis/request/${requestId}/spaces`, authenticated: true,
  })
  return unwrapApiResponse<AnalysisSpaceResponse[]>(response, '공간 조회에 실패했습니다.')
}

export async function getRecommendedProducts(requestId: number) {
  const response = await apiRequest<ApiResponse<RecommendedProduct[]>>({
    method: 'GET', url: `/api/analysis/request/${requestId}/recommended-products`, authenticated: true,
  })
  return unwrapApiResponse<RecommendedProduct[]>(response, '추천 상품 조회에 실패했습니다.')
}
