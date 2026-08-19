import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getChatMessages, getChatThreads, readChat } from '@/api/chatApi'
import { getVisit } from '@/api/visitApi'
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
vi.mock('@/hooks/useContractorRequest', () => ({ default: vi.fn() }))
vi.mock('@/contexts/useRealtime', () => ({ default: () => ({ latestEvent: null }) }))

const getChatMessagesMock = vi.mocked(getChatMessages)
const getChatThreadsMock = vi.mocked(getChatThreads)
const readChatMock = vi.mocked(readChat)
const getVisitMock = vi.mocked(getVisit)
const useContractorRequestMock = vi.mocked(useContractorRequest)

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
    getVisitMock.mockReset().mockResolvedValue({ id: 1, requestId: 99, status: 'UNSCHEDULED' })
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
        status: 'approved',
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
    getVisitMock.mockResolvedValue({ id: 1, requestId: 99, status: 'COMPLETED' })

    renderChat('/contractor/requests/99/chat')

    expect(await screen.findByRole('link', { name: '견적서 작성' })).toHaveAttribute('href', '/contractor/requests/99/estimate-ready')
  })
})
