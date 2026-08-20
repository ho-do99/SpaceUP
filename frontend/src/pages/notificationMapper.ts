import type { NotificationResponse, NotificationType } from '@/api/notificationApi'
import type { NotificationCategory, UserNotification } from '@/mocks/notifications'
import type { ChatThread } from '@/types/backendContractor'

const categoryByType: Record<NotificationType, NotificationCategory> = {
  QUOTE: 'estimate', SCHEDULE: 'schedule', REQUEST: 'estimate', SETTLEMENT: 'system',
  CHAT: 'chat', VISIT: 'schedule', REVIEW: 'system', PROJECT: 'schedule',
}
const labelByCategory: Record<NotificationCategory, string> = {
  estimate: '견적', schedule: '일정', chat: '채팅', system: '시스템',
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function destinationFor(value: NotificationResponse, threads: readonly ChatThread[]) {
  const thread = value.requestId && value.contractorId
    ? threads.find((candidate) => candidate.requestId === value.requestId && candidate.contractorId === value.contractorId)
    : threads.find((candidate) => `${value.title} ${value.content}`.includes(candidate.requestCode))
  const requestId = value.requestId ?? thread?.requestId
  const contractorId = value.contractorId ?? thread?.contractorId
  if (!requestId || !contractorId) return undefined
  if (value.type === 'VISIT') return `/mypage/requests/${requestId}/chat/${contractorId}`
  if (value.type === 'CHAT' || (value.type === 'REQUEST' && value.title.includes('승인'))) {
    return `/mypage/requests/${requestId}/chat/${contractorId}`
  }
  return `/mypage/requests/${requestId}`
}

export function mapNotification(value: NotificationResponse, now = new Date(), threads: readonly ChatThread[] = []): UserNotification {
  const createdAt = new Date(value.createdAt)
  const category = categoryByType[value.type]
  return {
    id: String(value.id), category, categoryLabel: labelByCategory[category], title: value.title,
    message: value.content, isRead: value.read,
    group: isSameDay(createdAt, now) ? 'today' : 'previous',
    occurredAtLabel: isSameDay(createdAt, now)
      ? createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : createdAt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
    destination: destinationFor(value, threads),
  }
}
