import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type {
  CatalogMaterialProduct,
  MaterialTheme,
  MaterialWorkType,
} from '@/types/materialCatalog'

export async function getMaterialCatalog(
  theme: MaterialTheme,
  workType: MaterialWorkType,
) {
  const response = await apiRequest<ApiResponse<CatalogMaterialProduct[]>>({
    method: 'GET',
    url: '/api/material-products',
    params: { theme, workType },
  })
  return unwrapApiResponse<CatalogMaterialProduct[]>(
    response,
    '자재 카탈로그를 불러오지 못했습니다.',
  )
}
