export type MemberRole = 'MEMBER' | 'CONTRACTOR' | 'ADMIN'

export interface Member {
  id: number
  email: string
  name: string
  role: MemberRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  member: Member
}
