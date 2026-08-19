import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getChatThreads } from '@/api/chatApi'
import ContractorChatListPage from './ContractorChatListPage'

vi.mock('@/api/chatApi', () => ({ getChatThreads: vi.fn() }))
vi.mock('@/contexts/useRealtime', () => ({ default: () => ({ latestEvent: null }) }))

const getChatThreadsMock = vi.mocked(getChatThreads)

describe('ContractorChatListPage live threads', () => {
  beforeEach(() => {
    getChatThreadsMock.mockReset().mockResolvedValue([{
      requestId: 99,
      contractorId: 5,
      requestCode: 'REQ-99',
      counterpartName: '읽을 수 있는 임대인',
      requestStatus: 'COMPLETED',
      participationStatus: 'CLOSED',
      contactable: false,
      lastMessage: '대화 기록입니다.',
      lastMessageAt: '2026-08-19T10:00:00',
      unreadCount: 0,
    }])
  })

  afterEach(cleanup)

  it('uses the live nickname and opens a readable closed room', async () => {
    render(
      <MemoryRouter initialEntries={['/contractor/chats']}>
        <Routes>
          <Route path="/contractor/chats" element={<ContractorChatListPage />} />
          <Route path="/contractor/requests/:requestId/chat" element={<p>closed room destination</p>} />
        </Routes>
      </MemoryRouter>,
    )

    const thread = await screen.findByRole('button', { name: 'REQ-99, 읽을 수 있는 임대인, 채팅 종료' })
    expect(screen.getByText('임대인 읽을 수 있는 임대인 · 채팅 종료')).toBeInTheDocument()

    fireEvent.click(thread)

    expect(await screen.findByText('closed room destination')).toBeInTheDocument()
  })
})
