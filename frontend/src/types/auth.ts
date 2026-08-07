export type UserRole =
  | 'LANDLORD'
  | 'CONTRACTOR'
  | 'ADMIN'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  memberId: number
  role: UserRole
}
