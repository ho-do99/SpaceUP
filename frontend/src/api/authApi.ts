import axiosInstance from './axiosInstance'
import type { AuthResponse, LoginRequest, Member } from '@/types/member'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', request)
  return response.data
}

export async function getCurrentMember(): Promise<Member> {
  const response = await axiosInstance.get<Member>('/members/me')
  return response.data
}
