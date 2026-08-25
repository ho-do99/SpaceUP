import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getChatMessages, getChatThreads, readChat, sendChatMessage } from '@/api/chatApi'
import { getVisit } from '@/api/visitApi'
import { readChatContextNotifications } from '@/api/notificationApi'
import ContractorPortalFlowProvider from '@/components/contractor/ContractorPortalFlowProvider'
import useContractorRequest from '@/hooks/useContractorRequest'
import type { ChatThread } from '@/types/backendContractor'
import ContractorChatPage from './ContractorChatPage'

vi.mock('@/api/chatApi', () => ({
  getChatMessages: vi.fn(),
  getChatThreads: vi.fn(),
  readChat: vi.fn(),
  sendChatMessage: vi.fn(),
}))
vi.mock('@/api/visitApi', () => ({ getVisit: vi.fn() }))
vi.mock('@/api/notificationApi', () => ({
  readChatContextNotifications: vi.fn(),
}))

vi.mock('@/hooks/useContractorRequest', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/hooks/useContractorRequest')>(),
  default: vi.fn(),
}))
const realtimeState = vi.hoisted(() => ({
  latestEvent: null as { type: 'CHAT_MESSAGE'; requestId: number } | null,
  refreshUnreadNotificationCount: vi.fn(),
}))
vi.mock('@/contexts/useRealtime', () => ({ default: () => realtimeState }))

const getChatMessagesMock = vi.mocked(getChatMessages)
const getChatThreadsMock = vi.mocked(getChatThreads)
const readChatMock = vi.mocked(readChat)
const sendChatMessageMock = vi.mocked(sendChatMessage)
const getVisitMock = vi.mocked(getVisit)
const useContractorRequestMock = vi.mocked(useContractorRequest)
const readChatContextNotificationsMock = vi.mocked(readChatContextNotifications)

const threadFixture: ChatThread = {
  requestId: 99,
  contractorId: 5,
  requestCode: 'REQ-99',
  counterpartName: '시연 임대인',
  requestStatus: 'QUOTE_REQUESTED',
  participationStatus: 'APPROVED',
  contactable: true,
  lastMessage: '방문 일정을 정해요.',
  lastMessageAt: '2026-08-19T10:00:00',
  unreadCount: 0,
}

function renderChat(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/contractor/requests/:requestId/chat" element={<ContractorPortalFlowProvider><ContractorChatPage /></ContractorPortalFlowProvider>} />
        <Route path="/contractor/requests/:requestId/chat/completed" element={<ContractorPortalFlowProvider><ContractorChatPage completed /></ContractorPortalFlowProvider>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ContractorChatPage live threads', () => {
  beforeEach(() => {
    getChatMessagesMock.mockReset().mockResolvedValue([])
    getChatThreadsMock.mockReset().mockResolvedValue([threadFixture])
    readChatMock.mockReset().mockResolvedValue(undefined)
    sendChatMessageMock.mockReset()
    realtimeState.latestEvent = null
    readChatContextNotificationsMock.mockReset().mockResolvedValue(undefined)
    realtimeState.refreshUnreadNotificationCount.mockReset().mockResolvedValue(undefined)
    getVisitMock.mockReset().mockResolvedValue({ id: 1, requestId: 99, contractorId: 5, status: 'UNSCHEDULED' })
    useContractorRequestMock.mockReset().mockReturnValue({
      request: {
        requestId: '99',
        customerName: '기존 요청 이름',
        maskedPhone: '010-0000-0000',
        property: { region: '광주광역시', address: '광주광역시', propertyType: '아파트', areaLabel: '84㎡' },
        budgetLabel: '5,000,000원',
        estimatedCostLabel: '분석 대기 중',
        matchScore: 90,
        desiredSchedule: '2026-09-01',
        status: 'in_progress',
        statusLabel: '승인됨',
        lastActivityLabel: '2026-08-19',
        analysis: { rooms: 3, bathrooms: 2, hasBalcony: true, kitchenType: '독립형', ceilingHeight: '2.3m' },
        selectedItems: [],
        lightingNotice: '',
        hasLinkedFloorPlan: false,
        photos: [],
      },
      loading: false,
      error: '',
    })
  })

  afterEach(cleanup)

  it('enables messages and visit scheduling for a contactable live thread', async () => {
    getChatThreadsMock.mockResolvedValue([{ ...threadFixture, requestId: 99, counterpartName: '시연 임대인', contactable: true }])

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('heading', { name: '시연 임대인 사용자' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '현장 방문 일정 잡기' })).toHaveAttribute('href', '/contractor/requests/99/visit')
    expect(screen.getByRole('textbox')).toBeEnabled()
  })

  it('keeps a closed thread readable but disables sending', async () => {
    getChatThreadsMock.mockResolvedValue([{ ...threadFixture, contactable: false }])

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('link', { name: '현장 방문 일정 잡기' })).toHaveAttribute('href', '/contractor/requests/99/visit')
  })

  it('offers quote writing when the live visit is completed', async () => {
    getVisitMock.mockResolvedValue({ id: 1, requestId: 99, contractorId: 5, status: 'COMPLETED' })

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('link', { name: '견적서 작성' })).toHaveAttribute('href', '/contractor/requests/99/estimate-ready')
  })

  it('disables duplicate quote writing after the final quote is accepted', async () => {
    getVisitMock.mockResolvedValue({ id: 1, requestId: 99, contractorId: 5, status: 'COMPLETED' })
    useContractorRequestMock.mockReturnValue({
      ...useContractorRequestMock(),
      request: {
        ...useContractorRequestMock().request!,
        acceptedQuoteAmount: 5_500_000,
        acceptedQuotePhase: 'FINAL',
      },
    })

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('button', { name: '견적서 작성 완료' })).toBeDisabled()
    expect(screen.queryByRole('link', { name: '견적서 작성' })).not.toBeInTheDocument()
    expect(screen.getAllByText('최종 견적이 확정되어 추가 견적서를 작성할 수 없습니다.').length).toBeGreaterThan(0)
  })
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function renderChatWithNavigation() {
  function Harness() {
    const navigate = useNavigate()
    return (
      <>
        <button type="button" onClick={() => navigate('/contractor/requests/100/chat')}>다음 채팅방</button>
        <Routes>
          <Route path="/contractor/requests/:requestId/chat" element={<ContractorPortalFlowProvider><ContractorChatPage /></ContractorPortalFlowProvider>} />
        </Routes>
      </>
    )
  }

  return render(<MemoryRouter initialEntries={['/contractor/requests/99/chat']}><Harness /></MemoryRouter>)
}

function renderChatWithRealtimeRefresh() {
  function Harness() {
    const [, setVersion] = useState(0)
    return (
      <>
        <button type="button" onClick={() => {
          realtimeState.latestEvent = { type: 'CHAT_MESSAGE', requestId: 99 }
          setVersion((version) => version + 1)
        }}>실시간 새로고침</button>
        <Routes>
          <Route path="/contractor/requests/:requestId/chat" element={<ContractorPortalFlowProvider><ContractorChatPage /></ContractorPortalFlowProvider>} />
        </Routes>
      </>
    )
  }

  return render(<MemoryRouter initialEntries={['/contractor/requests/99/chat']}><Harness /></MemoryRouter>)
}


  it.each(['1e3', '0x10', '1.0'])('keeps %s on the mock route instead of calling live chat APIs', (requestId) => {
    renderChat(`/contractor/requests/${requestId}/chat`)

    expect(getChatMessagesMock).not.toHaveBeenCalled()
    expect(getChatThreadsMock).not.toHaveBeenCalled()
    expect(getVisitMock).not.toHaveBeenCalled()
  })

  it('does not retain a previous numeric room while the next room is loading', async () => {
    getChatMessagesMock.mockImplementation((requestId) => requestId === 99
      ? Promise.resolve([{ id: 1, senderType: 'LANDLORD', senderName: '임대인', content: '99번 메시지', read: false, createdAt: '2026-08-19T10:00:00' }])
      : new Promise(() => undefined))
    getChatThreadsMock.mockImplementation(() => Promise.resolve([{ ...threadFixture, requestId: 99, contactable: true }]))

    renderChatWithNavigation()
    expect(await screen.findByText('99번 메시지')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '다음 채팅방' }))

    expect(screen.queryByText('99번 메시지')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '잘못된 전송' } })
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(sendChatMessageMock).not.toHaveBeenCalled()
  })

  it('shows a visit lookup error instead of inferring incomplete visit actions', async () => {
    getVisitMock.mockRejectedValue(new Error('방문 일정 조회 실패'))

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('alert')).toHaveTextContent('방문 일정을 불러오지 못했습니다.')
    expect(screen.queryByRole('link', { name: '현장 방문 일정 잡기' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '견적서 작성' })).not.toBeInTheDocument()
  })

  it('keeps the newest realtime room response when the initial response resolves later', async () => {
    const initialMessages = deferred<Awaited<ReturnType<typeof getChatMessages>>>()
    const initialThreads = deferred<Awaited<ReturnType<typeof getChatThreads>>>()
    const realtimeMessages = deferred<Awaited<ReturnType<typeof getChatMessages>>>()
    const realtimeThreads = deferred<Awaited<ReturnType<typeof getChatThreads>>>()
    getChatMessagesMock.mockReset()
      .mockReturnValueOnce(initialMessages.promise)
      .mockReturnValueOnce(realtimeMessages.promise)
    getChatThreadsMock.mockReset()
      .mockReturnValueOnce(initialThreads.promise)
      .mockReturnValueOnce(realtimeThreads.promise)

    renderChatWithRealtimeRefresh()
    await waitFor(() => expect(getChatMessagesMock).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '실시간 새로고침' }))
    await waitFor(() => expect(getChatMessagesMock).toHaveBeenCalledTimes(2))

    await act(async () => {
      realtimeMessages.resolve([{ id: 2, senderType: 'LANDLORD', senderName: '임대인', content: '최신 메시지', read: false, createdAt: '2026-08-19T10:01:00' }])
      realtimeThreads.resolve([{ ...threadFixture, contactable: false }])
    })
    expect(await screen.findByText('최신 메시지')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()

    await act(async () => {
      initialMessages.resolve([{ id: 1, senderType: 'LANDLORD', senderName: '임대인', content: '오래된 메시지', read: false, createdAt: '2026-08-19T10:00:00' }])
      initialThreads.resolve([{ ...threadFixture, contactable: true }])
    })
    await waitFor(() => expect(screen.queryByText('오래된 메시지')).not.toBeInTheDocument())
    expect(screen.getByText('최신 메시지')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

})
