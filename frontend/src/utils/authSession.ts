import type { LoginResponse, UserRole } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'accessToken'
const MEMBER_ID_KEY = 'memberId'
const USER_ROLE_KEY = 'role'

const userRoles: readonly UserRole[] = [
  'LANDLORD',
  'CONTRACTOR',
  'ADMIN',
]

function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value)
}

export function saveAuthSession(session: LoginResponse) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  sessionStorage.setItem(MEMBER_ID_KEY, String(session.memberId))
  sessionStorage.setItem(USER_ROLE_KEY, session.role)
}

export function getAccessToken() {
  const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  return accessToken && accessToken.trim() ? accessToken : null
}

export function getMemberId() {
  const storedMemberId = sessionStorage.getItem(MEMBER_ID_KEY)
  if (!storedMemberId) return null

  const memberId = Number(storedMemberId)
  return Number.isFinite(memberId) && memberId > 0 ? memberId : null
}

export function getUserRole() {
  const role = sessionStorage.getItem(USER_ROLE_KEY)
  return role && isUserRole(role) ? role : null
}

export function clearAuthSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(MEMBER_ID_KEY)
  sessionStorage.removeItem(USER_ROLE_KEY)
}
