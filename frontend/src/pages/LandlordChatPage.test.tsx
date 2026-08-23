import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useState } from 'react'

import { getChatMessages, getChatThreads, readChat } from '@/api/chatApi'
import { getQuotesByRequest } from '@/api/estimateApi'
import { readChatContextNotifications } from '@/api/notificationApi'
import { getVisit } from '@/api/visitApi'
import type { ChatThread, QuoteResponse } from '@/types/backendContractor'
import LandlordChatPage from './LandlordChatPage'

vi.mock('@/api/chatApi', () => ({
  getChatMessages: vi.fn(),
  getChatThreads: vi.fn(),
  readChat: vi.fn(),
  sendChatMessage: vi.fn(),
}))
vi.mock('@/api/estimateApi', () => ({ getQuotesByRequest: vi.fn() }))
vi.mock('@/api/notificationApi', () => ({ readChatContextNotifications: vi.fn() }))
vi.mock('@/api/visitApi', () => ({ getVisit: vi.fn() }))
const realtimeState = vi.hoisted(() => ({
  latestEvent: null as null | {
    type: 'NOTIFICATION_CHANGED'
    notificationId: number
    requestId: number
    contractorId: number
    messageId: null
    sequence: number
  },
  refreshUnreadNotificationCount: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/contexts/useRealtime', () => ({ default: () => realtimeState }))

const getChatMessagesMock = vi.mocked(getChatMessages)
const getChatThreadsMock = vi.mocked(getChatThreads)
const getQuotesByRequestMock = vi.mocked(getQuotesByRequest)
const getVisitMock = vi.mocked(getVisit)
const readChatMock = vi.mocked(readChat)
const readChatContextNotificationsMock = vi.mocked(readChatContextNotifications)

const thread: ChatThread = {
  requestId: 138,
  contractorId: 19,
  requestCode: 'REQ-260821-000138',
  counterpartName: '마블건축 (시연용)',
  requestStatus: 'QUOTE_REQUESTED',
  participationStatus: 'APPROVED',
  contactable: true,
  lastMessage: null,
  lastMessageAt: null,
  unreadCount: 0,
}

function quote(overrides: Partial<QuoteResponse>): QuoteResponse {
  return {
    id: 1,
    requestId: 138,
    contractorId: 19,
    contractorName: '마블건축 (시연용)',
    totalAmount: 1_100_000,
    status: 'SUBMITTED',
    phase: 'FINAL',
    revisionCount: 1,
    createdAt: '2026-08-23T10:00:00',
    items: [],
    ...overrides,
  }
}

function renderChat() {
  return render(
    <MemoryRouter initialEntries={['/mypage/requests/138/chat/19']}>
      <Routes>
        <Route path="/mypage/requests/:requestId/chat/:contractorId" element={<LandlordChatPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderChatWithRealtimeQuote() {
  function Harness() {
    const [, setVersion] = useState(0)
    return (
      <>
        <button type="button" onClick={() => {
          realtimeState.latestEvent = {
            type: 'NOTIFICATION_CHANGED',
            notificationId: 10,
            requestId: 138,
            contractorId: 19,
            messageId: null,
            sequence: 1,
          }
          setVersion((version) => version + 1)
        }}>
          견적 알림 수신
        </button>
        <Routes>
          <Route path="/mypage/requests/:requestId/chat/:contractorId" element={<LandlordChatPage />} />
        </Routes>
      </>
    )
  }

  return render(
    <MemoryRouter initialEntries={['/mypage/requests/138/chat/19']}>
      <Harness />
    </MemoryRouter>,
  )
}

describe('LandlordChatPage quote card', () => {
  beforeEach(() => {
    getChatMessagesMock.mockReset().mockResolvedValue([])
    getChatThreadsMock.mockReset().mockResolvedValue([thread])
    getVisitMock.mockReset().mockResolvedValue({
      id: 1,
      requestId: 138,
      contractorId: 19,
      status: 'COMPLETED',
    })
    readChatMock.mockReset().mockResolvedValue(undefined)
    readChatContextNotificationsMock.mockReset().mockResolvedValue(undefined)
    realtimeState.refreshUnreadNotificationCount.mockClear()
    realtimeState.latestEvent = null
    getQuotesByRequestMock.mockReset()
  })

  afterEach(cleanup)

  it('links the newest sent quote from the current contractor', async () => {
    getQuotesByRequestMock.mockResolvedValue([
      quote({ id: 41, createdAt: '2026-08-23T09:00:00', totalAmount: 900_000 }),
      quote({ id: 99, contractorId: 20, createdAt: '2026-08-23T12:00:00' }),
      quote({ id: 77, createdAt: '2026-08-23T11:00:00', totalAmount: 2_750_000 }),
    ])

    renderChat()

    expect(await screen.findByText('견적서가 도착했어요')).toBeInTheDocument()
    expect(screen.getByText('2,750,000원')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '견적서 확인하기' })).toHaveAttribute('href', '/estimate/77')
    expect(screen.queryByText('900,000원')).not.toBeInTheDocument()
  })

  it('does not show a card for a draft quote', async () => {
    getQuotesByRequestMock.mockResolvedValue([
      quote({ id: 88, status: 'DRAFT', totalAmount: 3_000_000 }),
    ])

    renderChat()

    expect(await screen.findByRole('heading', { name: '마블건축 (시연용)' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '견적서 확인하기' })).not.toBeInTheDocument()
  })

  it('shows a newly sent quote when its notification arrives while the chat is open', async () => {
    getQuotesByRequestMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([quote({ id: 91, totalAmount: 4_200_000 })])

    renderChatWithRealtimeQuote()

    expect(await screen.findByRole('heading', { name: '마블건축 (시연용)' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '견적서 확인하기' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '견적 알림 수신' }))

    expect(await screen.findByText('4,200,000원')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '견적서 확인하기' })).toHaveAttribute('href', '/estimate/91')
  })
})
