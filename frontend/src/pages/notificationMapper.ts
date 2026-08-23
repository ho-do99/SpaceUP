import type { NotificationResponse, NotificationType } from '@/api/notificationApi'
import type { NotificationCategory, UserNotification } from '@/mocks/notifications'
import type { ChatThread, QuoteResponse } from '@/types/backendContractor'
import { formatBrowserTime, parseApiDateTime } from '@/utils/browserDateTime'

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

export function notificationContextFor(value: NotificationResponse, threads: readonly ChatThread[]) {
  const exactThread = value.requestId && value.contractorId
    ? threads.find((candidate) => candidate.requestId === value.requestId && candidate.contractorId === value.contractorId)
    : threads.find((candidate) => `${value.title} ${value.content}`.includes(candidate.requestCode))
  const thread = exactThread ?? (value.type === 'QUOTE'
    ? threads.find((candidate) => candidate.counterpartName
      && `${value.title} ${value.content}`.includes(candidate.counterpartName))
    : undefined)
  const requestId = value.requestId ?? thread?.requestId
  const contractorId = value.contractorId ?? thread?.contractorId
  return { requestId, contractorId, thread }
}

function destinationFor(
  value: NotificationResponse,
  threads: readonly ChatThread[],
  quotes: readonly QuoteResponse[],
) {
  const { requestId, contractorId } = notificationContextFor(value, threads)
  if (value.type === 'QUOTE' && requestId) {
    const quote = contractorId
      ? quotes
        .filter((candidate) => candidate.requestId === requestId
          && candidate.contractorId === contractorId
          && candidate.status !== 'DRAFT')
        .sort((left, right) => {
          const leftCreatedAt = left.createdAt ? Date.parse(left.createdAt) : 0
          const rightCreatedAt = right.createdAt ? Date.parse(right.createdAt) : 0
          return rightCreatedAt - leftCreatedAt || right.id - left.id
        })[0]
      : undefined
    return quote ? `/estimate/${quote.id}` : `/mypage/requests/${requestId}`
  }
  if (value.type === 'PROJECT' && requestId) return `/mypage/requests/${requestId}`
  if (value.type === 'REQUEST' && requestId && !value.title.includes('승인')) {
    return `/mypage/requests/${requestId}`
  }
  if (!requestId || !contractorId) return undefined
  if (value.type === 'VISIT') return `/mypage/requests/${requestId}/chat/${contractorId}`
  if (value.type === 'CHAT' || (value.type === 'REQUEST' && value.title.includes('승인'))) {
    return `/mypage/requests/${requestId}/chat/${contractorId}`
  }
  return `/mypage/requests/${requestId}`
}

export function mapNotification(
  value: NotificationResponse,
  now = new Date(),
  threads: readonly ChatThread[] = [],
  quotes: readonly QuoteResponse[] = [],
): UserNotification {
  const createdAt = parseApiDateTime(value.createdAt)
  const category = categoryByType[value.type]
  const occurredToday = createdAt ? isSameDay(createdAt, now) : false
  const { requestId, thread: matchedThread } = notificationContextFor(value, threads)
  return {
    id: String(value.id), category, categoryLabel: labelByCategory[category], title: value.title,
    message: value.content, isRead: value.read,
    group: occurredToday ? 'today' : 'previous',
    occurredAtLabel: occurredToday
      ? formatBrowserTime(value.createdAt)
      : createdAt?.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) ?? value.createdAt,
    flowLabel: matchedThread?.requestCode
      ? `의뢰 ${matchedThread.requestCode}`
      : requestId ? `의뢰 REQ-ID-${requestId}` : undefined,
    destination: destinationFor(value, threads, quotes),
  }
}
