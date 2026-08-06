export type MemberRole =
  | 'LANDLORD'
  | 'CONTRACTOR'
  | 'MATERIAL_VENDOR'
  | 'ADMIN'

export type MemberApprovalStatus =
  | 'PENDING'
  | 'NEEDS_REVISION'
  | 'APPROVED'

/**
 * POST /api/member/login 요청
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * POST /api/member/login 응답의 data
 */
export interface AuthResponse {
  accessToken: string
  memberId: number
  role: MemberRole
}

/**
 * GET /api/member/{memberId} 응답의 data
 */
export interface Member {
  id: number
  username: string
  email: string
  name: string
  phoneNumber: string
  phoneVerified: boolean
  role: MemberRole
  approvalStatus: MemberApprovalStatus
  applicationNumber: string | null
  approvalNumber: string | null
  revisionMessage: string | null
  revisionDeadline: string | null
  createdAt: string
}

/**
 * 회원 조회 응답이라는 의미를 명확히 사용할 때를 위한 별칭
 */
export type MemberResponse = Member