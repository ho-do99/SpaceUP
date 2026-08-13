import { ApiClientError, apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type {
  AnalysisJobResponse,
  AnalysisJobEditInput,
  AnalysisSpaceInput,
  AnalysisSpaceResponse,
  InteriorImageGenerateInput,
  InteriorImageGenerateResponse,
  RecommendedProduct,
} from '@/types/analysis'

const INTERIOR_IMAGE_TIMEOUT_MS = 75_000
const FLOOR_PLAN_SCAN_TIMEOUT_MS = 45_000

export async function getAnalysis(requestId: number) {
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>>({
    method: 'GET', url: `/api/analysis/request/${requestId}`, authenticated: true,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '분석 조회에 실패했습니다.')
}

export async function requestAnalysis(requestId: number) {
  const response = await apiRequest<ApiResponse<number>>({
    method: 'POST', url: `/api/analysis/request/${requestId}`, authenticated: true,
  })
  return unwrapApiResponse<number>(response, '분석 요청 생성에 실패했습니다.')
}

export async function updateAnalysis(requestId: number, input: AnalysisJobEditInput) {
  const response = await apiRequest<ApiResponse<null>, AnalysisJobEditInput>({
    method: 'PATCH', url: `/api/analysis/request/${requestId}`, data: input, authenticated: true,
  })
  if (!response.success) throw new ApiClientError(response.message || '분석 정보 수정에 실패했습니다.', 'business')
}

export async function scanFloorPlan(requestId: number, file: File) {
  const data = new FormData()
  data.append('file', file)
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>, FormData>({
    method: 'POST',
    url: `/api/analysis/request/${requestId}/floorplan-scan`,
    data,
    authenticated: true,
    timeout: FLOOR_PLAN_SCAN_TIMEOUT_MS,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '평면도 분석에 실패했습니다.')
}

export async function scanLinkedFloorPlan(requestId: number) {
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>>({
    method: 'POST',
    url: `/api/analysis/request/${requestId}/floorplan-scan-linked`,
    authenticated: true,
    timeout: FLOOR_PLAN_SCAN_TIMEOUT_MS,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '연결된 평면도 분석에 실패했습니다.')
}

export async function scanStoredFloorPlan(requestId: number, floorPlanVariantId: number) {
  const response = await apiRequest<ApiResponse<AnalysisJobResponse>, { floorPlanVariantId: number }>({
    method: 'POST',
    url: `/api/analysis/request/${requestId}/floorplan-scan-storage`,
    data: { floorPlanVariantId },
    authenticated: true,
    timeout: FLOOR_PLAN_SCAN_TIMEOUT_MS,
  })
  return unwrapApiResponse<AnalysisJobResponse>(response, '등록 평면도 분석에 실패했습니다.')
}

export async function replaceAnalysisSpaces(requestId: number, spaces: AnalysisSpaceInput[]) {
  const response = await apiRequest<ApiResponse<null>, AnalysisSpaceInput[]>({
    method: 'PUT', url: `/api/analysis/request/${requestId}/spaces`, data: spaces, authenticated: true,
  })
  unwrapEmptyApiResponse(response, '공간 저장에 실패했습니다.')
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

export async function generateInteriorImages(
  requestId: number,
  input: InteriorImageGenerateInput,
  signal?: AbortSignal,
) {
  const response = await apiRequest<ApiResponse<InteriorImageGenerateResponse>, InteriorImageGenerateInput>({
    method: 'POST',
    url: `/api/analysis/request/${requestId}/interior-images`,
    data: input,
    authenticated: true,
    timeout: INTERIOR_IMAGE_TIMEOUT_MS,
    signal,
  })
  return unwrapApiResponse<InteriorImageGenerateResponse>(response, 'AI 이미지 생성에 실패했습니다.')
}

export function getInteriorImageGenerationErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) return 'AI 이미지 생성 중 오류가 발생했습니다.'
  if (error.kind === 'canceled') return ''
  if (error.status === 401) return '로그인이 만료되었습니다. 다시 로그인해 주세요.'
  if (error.status === 403) return '이 의뢰의 AI 이미지를 생성할 권한이 없습니다.'
  if (error.status === 503) return 'AI 생성 설정을 확인할 수 없습니다.'
  if (error.kind === 'network') return 'AI 생성 응답이 지연되고 있습니다. 다시 시도해 주세요.'
  return error.message || 'AI 이미지 생성 중 오류가 발생했습니다.'
}
