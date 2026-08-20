export type NotificationCategory = 'estimate' | 'schedule' | 'chat' | 'system'

export interface UserNotification {
  readonly id: string
  readonly category: NotificationCategory
  readonly categoryLabel: string
  readonly title: string
  readonly message: string
  readonly occurredAtLabel: string
  readonly group: 'today' | 'previous'
  readonly isRead: boolean
  readonly flowLabel?: string
  readonly destination?: string
}

export const notificationFilters = [
  { id: 'all', label: '전체' },
  { id: 'estimate', label: '견적' },
  { id: 'schedule', label: '일정' },
  { id: 'chat', label: '채팅' },
  { id: 'system', label: '시스템' },
] as const

export type NotificationFilter = (typeof notificationFilters)[number]['id']

export const userNotifications: readonly UserNotification[] = [
  {
    id: 'new-chat-space-design',
    category: 'chat',
    categoryLabel: '채팅',
    title: '공간디자인 인테리어에서 새 메시지가 도착했습니다.',
    message: '현장 방문 일정을 확인해 주세요.',
    occurredAtLabel: '5분 전',
    group: 'today',
    isRead: false,
  },
  {
    id: 'site-visit-confirmed',
    category: 'schedule',
    categoryLabel: '일정',
    title: '현장 방문 일정이 확정되었습니다.',
    message: '7월 25일 토요일 오후 3시에 시공업체가 방문할 예정입니다.',
    occurredAtLabel: '20분 전',
    group: 'today',
    isRead: false,
  },
  {
    id: 'house-up-reviewing',
    category: 'estimate',
    categoryLabel: '견적',
    title: '하우스업 인테리어가 견적 요청을 검토 중입니다.',
    message: '시공업체의 답변이 도착하면 알림으로 알려드릴게요.',
    occurredAtLabel: '1시간 전',
    group: 'today',
    isRead: false,
    destination: '/mypage/requests/request-house-up',
  },
  {
    id: 'safe-transaction-guide',
    category: 'system',
    categoryLabel: '시스템',
    title: '개인정보 보호를 위한 안전 거래 안내',
    message: '시공업체와의 상담과 일정 조율은 SpaceUP 채팅에서 진행해 주세요.',
    occurredAtLabel: '오늘',
    group: 'today',
    isRead: false,
  },
  {
    id: 'request-delivered-space-design',
    category: 'estimate',
    categoryLabel: '견적',
    title: '공간디자인 인테리어에 견적 요청이 전달되었습니다.',
    message: '시공업체에서 요청 내용을 확인하고 있습니다.',
    occurredAtLabel: '7월 20일',
    group: 'previous',
    isRead: true,
    destination: '/mypage/requests/request-space-design',
  },
  {
    id: 'signup-complete',
    category: 'system',
    categoryLabel: '시스템',
    title: '회원가입이 완료되었습니다.',
    message: 'SpaceUP에서 인테리어 분석과 시공사 상담을 시작해 보세요.',
    occurredAtLabel: '7월 18일',
    group: 'previous',
    isRead: true,
  },
]
