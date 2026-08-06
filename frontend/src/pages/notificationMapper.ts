import type { NotificationResponse, NotificationType } from '@/api/notificationApi'
import type { NotificationCategory, UserNotification } from '@/mocks/notifications'

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

export function mapNotification(value: NotificationResponse, now = new Date()): UserNotification {
  const createdAt = new Date(value.createdAt)
  const category = categoryByType[value.type]
  return {
    id: String(value.id), category, categoryLabel: labelByCategory[category], title: value.title,
    message: value.content, isRead: value.read,
    group: isSameDay(createdAt, now) ? 'today' : 'previous',
    occurredAtLabel: isSameDay(createdAt, now)
      ? createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      : createdAt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
  }
}
