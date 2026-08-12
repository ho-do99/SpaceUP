import { apiRequest } from './axiosInstance'
import { unwrapApiResponse } from './apiResponse'
import type { ApiResponse } from '@/types/api'
import type {
  RentalApartmentSearchPage,
  RentalApartmentSearchParams,
} from '@/types/rentalApartment'

export async function searchRentalApartments({
  sggCode,
  keyword,
  page = 0,
  size = 20,
}: RentalApartmentSearchParams = {}) {
  if (sggCode !== undefined && !/^\d{5}$/.test(sggCode)) {
    throw new Error('시군구 코드는 숫자 5자리여야 합니다.')
  }

  const params: Record<string, string | number> = { page, size }
  if (sggCode) params.sggCode = sggCode
  if (keyword?.trim()) params.keyword = keyword.trim()

  const response = await apiRequest<ApiResponse<RentalApartmentSearchPage>>({
    method: 'GET',
    url: '/api/rental-transactions/apartments',
    params,
    authenticated: false,
  })

  return unwrapApiResponse<RentalApartmentSearchPage>(
    response,
    '아파트 검색에 실패했습니다.',
  )
}
