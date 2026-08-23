import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { QuoteResponse } from '@/types/backendContractor'

import EstimateRequestDetailPage from './EstimateRequestDetailPage'

const mocks = vi.hoisted(() => ({ useEstimateRequestDetail: vi.fn() }))

vi.mock('@/hooks/useEstimateRequests', () => ({
  useEstimateRequestDetail: mocks.useEstimateRequestDetail,
}))

const request = {
  id: '114',
  requestCode: 'REQ-260820-000114',
  contractorId: '',
  contractorName: '마블건축',
  regionAndSpecialty: '전남광주통합특별시 서구 무진대로 919 · REQ-260820-000114',
  requestedAtLabel: '2026-08-20',
  itemCountLabel: '3개 항목',
  status: 'reviewing' as const,
  statusLabel: '견적 비교',
  progressLabel: '시공사 견적 접수 중',
  budgetLabel: '10,000,000원',
  preferredDateLabel: '2026-08-21',
  requestMessage: '거실 조명 교체, 바닥재 교체, 벽지 교체',
  selectedItems: ['거실 조명 교체', '바닥재 교체', '벽지 교체'],
  responseStatusLabel: '시공사 견적 접수 중',
}

const quote: QuoteResponse = {
  id: 19,
  requestId: 114,
  contractorId: 19,
  contractorName: '마블건축',
  title: '의뢰 #114 리모델링 견적',
  durationDays: 3,
  totalAmount: 5_171_518,
  status: 'SUBMITTED' as const,
  phase: 'PRELIMINARY' as const,
  revisionCount: 0,
  items: [],
}

function mockDetail(quotes = [quote]) {
  mocks.useEstimateRequestDetail.mockReturnValue({
    request,
    quotes,
    usingLiveData: true,
    numericId: 114,
    loading: false,
    error: '',
  })
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/mypage/requests/114']}>
      <Routes>
        <Route path="/mypage/requests/:requestId" element={<EstimateRequestDetailPage />} />
        <Route path="/mypage/requests/:requestId/visit/:contractorId" element={<p>visit schedule page</p>} />
        <Route path="/estimate/:quoteId" element={<p>quote page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EstimateRequestDetailPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockDetail()
  })

  afterEach(cleanup)

  it('links a submitted quote to its individual quote detail', () => {
    renderDetail()

    expect(screen.getByText('의뢰 REQ-260820-000114 · 견적 ID-19')).toBeInTheDocument()
    expect(screen.getAllByText('마블건축').length).toBeGreaterThan(0)
    expect(screen.queryByText('시공사 #19')).not.toBeInTheDocument()
    expect(screen.queryByText('이 시공사 선택')).not.toBeInTheDocument()
    expect(screen.queryByText(/의뢰 #114/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '견적서 확인하기' })).toHaveAttribute('href', '/estimate/19')
    expect(screen.queryByRole('button', { name: '결제 하기' })).not.toBeInTheDocument()
  })

  it('uses an accepted preliminary quote to continue to the matching site visit', () => {
    mockDetail([{ ...quote, status: 'ACCEPTED' as const }])
    renderDetail()

    const [visitButton] = screen.getAllByRole('button', { name: '방문 일정 확인' })
    fireEvent.click(visitButton)

    expect(screen.getByText('visit schedule page')).toBeInTheDocument()
  })

  it('uses an accepted final quote to continue to the payment preparation screen', () => {
    mockDetail([{ ...quote, id: 77, status: 'ACCEPTED' as const, phase: 'FINAL' as const }])
    renderDetail()

    const [paymentButton] = screen.getAllByRole('button', { name: '결제 단계 확인' })
    fireEvent.click(paymentButton)

    expect(screen.getByText('quote page')).toBeInTheDocument()
  })
})
