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
})
