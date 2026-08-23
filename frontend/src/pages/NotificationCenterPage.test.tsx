import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import NotificationCenterPage from './NotificationCenterPage'

const mocks = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  readNotification: vi.fn(),
  readAllNotifications: vi.fn(),
  getChatThreads: vi.fn(),
  getQuotesByRequest: vi.fn(),
  refreshUnreadNotificationCount: vi.fn(),
}))

vi.mock('@/api/notificationApi', () => ({
  getNotifications: mocks.getNotifications,
  readNotification: mocks.readNotification,
  readAllNotifications: mocks.readAllNotifications,
}))
vi.mock('@/api/chatApi', () => ({ getChatThreads: mocks.getChatThreads }))
vi.mock('@/api/estimateApi', () => ({ getQuotesByRequest: mocks.getQuotesByRequest }))
vi.mock('@/contexts/useRealtime', () => ({
  default: () => ({ latestEvent: null, refreshUnreadNotificationCount: mocks.refreshUnreadNotificationCount }),
}))

describe('NotificationCenterPage', () => {
  beforeEach(() => {
    mocks.getNotifications.mockReset().mockResolvedValue({ content: [{
      id: 14,
      type: 'QUOTE',
      title: '새 견적이 도착했습니다',
      content: 'REQ-260823-000142 · 마블건축님이 2,430,256원 견적을 보냈습니다.',
      read: false,
      requestId: 142,
      contractorId: 19,
      createdAt: new Date().toISOString(),
    }] })
    mocks.getChatThreads.mockReset().mockResolvedValue([{
      requestId: 142,
      contractorId: 19,
      requestCode: 'REQ-260823-000142',
      counterpartName: '마블건축',
      requestStatus: 'QUOTE_REQUESTED',
      participationStatus: 'APPROVED',
      contactable: true,
      unreadCount: 0,
    }])
    mocks.getQuotesByRequest.mockReset().mockResolvedValue([{
      id: 8,
      requestId: 142,
      contractorId: 19,
      contractorName: '마블건축',
      totalAmount: 2_430_256,
      status: 'SUBMITTED',
      phase: 'FINAL',
      revisionCount: 1,
      createdAt: '2026-08-23T19:40:00',
      items: [],
    }])
    mocks.readNotification.mockReset().mockResolvedValue(undefined)
    mocks.readAllNotifications.mockReset().mockResolvedValue(undefined)
    mocks.refreshUnreadNotificationCount.mockReset().mockResolvedValue(undefined)
  })

  afterEach(cleanup)

  it('opens the same individual quote detail used by the chat quote card', async () => {
    render(
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/estimate/:quoteId" element={<p>individual quote detail</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /새 견적이 도착했습니다/ }))

    expect(await screen.findByText('individual quote detail')).toBeInTheDocument()
    expect(mocks.getQuotesByRequest).toHaveBeenCalledWith(142)
    expect(mocks.readNotification).toHaveBeenCalledWith(14)
  })
})
