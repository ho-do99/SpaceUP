export type UserRole =
  | 'LANDLORD'
  | 'CONTRACTOR'
  | 'ADMIN'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  memberId: number
  role: UserRole
}
