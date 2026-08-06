export type UserRole =
  | 'LANDLORD'
  | 'CONTRACTOR'
  | 'MATERIAL_VENDOR'
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
