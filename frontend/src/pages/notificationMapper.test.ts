import { describe, expect, it } from 'vitest'
import { mapNotification } from './notificationMapper'

describe('mapNotification', () => {
  it('maps backend enums and read state to the notification card model', () => {
    const result = mapNotification({
      id: 9, type: 'QUOTE', title: '견적 도착', content: '확인하세요', read: false,
      createdAt: '2026-08-06T08:00:00',
    }, new Date('2026-08-06T12:00:00'))

    expect(result).toMatchObject({ id: '9', category: 'estimate', categoryLabel: '견적', isRead: false, group: 'today' })
  })

  it('groups older notifications separately', () => {
    const result = mapNotification({
      id: 10, type: 'PROJECT', title: '공사', content: '완료', read: true,
      createdAt: '2026-08-05T23:59:59',
    }, new Date('2026-08-06T12:00:00'))
    expect(result.group).toBe('previous')
  })

  it('routes an approved request notification to its exact contractor chat', () => {
    const result = mapNotification({
      id: 11, type: 'REQUEST', title: '의뢰가 승인되었습니다', content: '채팅을 시작하세요',
      read: false, requestId: 98, contractorId: 20, createdAt: '2026-08-06T08:00:00',
    }, new Date('2026-08-06T12:00:00'))

    expect(result.destination).toBe('/mypage/requests/98/chat/20')
  })
  it('routes legacy approval notifications by request code when context columns were empty', () => {
    const result = mapNotification({
      id: 12, type: 'REQUEST', title: '의뢰가 승인되었습니다', content: 'REQ-260818-000098 의뢰를 승인했습니다',
      read: false, createdAt: '2026-08-06T08:00:00',
    }, new Date('2026-08-06T12:00:00'), [{
      requestId: 98, contractorId: 20, requestCode: 'REQ-260818-000098', counterpartName: '마블건축',
      requestStatus: 'QUOTE_REQUESTED', participationStatus: 'APPROVED', contactable: true, unreadCount: 0,
    }])

    expect(result.destination).toBe('/mypage/requests/98/chat/20')
  })

  it('routes visit notifications directly to the matching chat', () => {
    const result = mapNotification({
      id: 13, type: 'VISIT', title: '방문 일정 변경', content: '일정을 확인하세요',
      read: false, requestId: 98, contractorId: 20, createdAt: '2026-08-06T08:00:00',
    }, new Date('2026-08-06T12:00:00'))

    expect(result.destination).toBe('/mypage/requests/98/chat/20')
  })
})
