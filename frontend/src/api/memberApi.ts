import {
  ApiClientError,
  apiRequest,
} from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/api'
import type { MemberResponse } from '@/types/member'

/**
 * 로그인한 회원의 회원번호로 회원정보를 조회합니다.
 *
 * GET /api/member/{memberId}
 */
export async function getMember(
  memberId: number,
): Promise<MemberResponse> {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw new ApiClientError(
      '회원 번호가 올바르지 않습니다.',
      'invalid-response',
    )
  }

  const response = await apiRequest<ApiResponse<MemberResponse>>({
    method: 'GET',
    url: `/api/member/${memberId}`,
    authenticated: true,
  })

  if (!response.success) {
    throw new ApiClientError(
      response.message || '회원정보 조회에 실패했습니다.',
      'business',
    )
  }

  if (!response.data) {
    throw new ApiClientError(
      '회원정보 응답 데이터가 없습니다.',
      'invalid-response',
    )
  }

  return response.data
}