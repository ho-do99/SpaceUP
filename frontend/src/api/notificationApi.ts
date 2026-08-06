import { apiRequest } from './axiosInstance'
import { unwrapApiResponse, unwrapEmptyApiResponse } from './apiResponse'
import type { ApiResponse, PageResponse } from '@/types/api'

export type NotificationType = 'QUOTE' | 'SCHEDULE' | 'REQUEST' | 'SETTLEMENT' | 'CHAT' | 'VISIT' | 'REVIEW' | 'PROJECT'

export interface NotificationResponse {
  id: number
  type: NotificationType
  title: string
  content: string
  read: boolean
  createdAt: string
}

export async function getNotifications(params: { page?: number; size?: number } = {}) {
  const response = await apiRequest<ApiResponse<PageResponse<NotificationResponse>>>({
    method: 'GET', url: '/api/notifications/me', params, authenticated: true,
  })
  return unwrapApiResponse<PageResponse<NotificationResponse>>(response, '알림 목록 조회에 실패했습니다.')
}

export async function readNotification(id: number) {
  const response = await apiRequest<ApiResponse<null>>({ method: 'POST', url: `/api/notifications/${id}/read`, authenticated: true })
  return unwrapEmptyApiResponse(response, '알림 읽음 처리에 실패했습니다.')
}

export async function readAllNotifications() {
  const response = await apiRequest<ApiResponse<null>>({ method: 'POST', url: '/api/notifications/read-all', authenticated: true })
  return unwrapEmptyApiResponse(response, '알림 전체 읽음 처리에 실패했습니다.')
}
