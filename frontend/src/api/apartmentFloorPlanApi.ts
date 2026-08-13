import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type { ApartmentFloorPlanSearchPage, ApartmentFloorPlanSearchParams } from '@/types/apartmentFloorPlan'

export async function searchApartmentFloorPlans({
  keyword,
  page = 0,
  size = 20,
}: ApartmentFloorPlanSearchParams = {}) {
  const params: Record<string, string | number> = { page, size }
  if (keyword?.trim()) params.keyword = keyword.trim()

  const response = await apiRequest<ApiResponse<ApartmentFloorPlanSearchPage>>({
    method: 'GET',
    url: '/api/floorplans/apartments/search',
    params,
    authenticated: false,
  })
  return unwrapApiResponse<ApartmentFloorPlanSearchPage>(response, '아파트 검색에 실패했습니다.')
}

export function getFloorPlanVariantPreviewUrl(variantId: number) {
  return `/api/floorplans/variants/${variantId}/image`
}
