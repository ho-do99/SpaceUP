import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import EstimateRequestDetailPage from './EstimateRequestDetailPage'

const mocks = vi.hoisted(() => ({ useEstimateRequestDetail: vi.fn() }))

vi.mock('@/hooks/useEstimateRequests', () => ({
  useEstimateRequestDetail: mocks.useEstimateRequestDetail,
}))

describe('EstimateRequestDetailPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.useEstimateRequestDetail.mockReturnValue({
      request: {
        id: '114',
        requestCode: 'REQ-260820-000114',
        contractorId: '',
        contractorName: '마블건축',
        regionAndSpecialty: '전남광주통합특별시 서구 무진대로 919 · REQ-260820-000114',
        requestedAtLabel: '2026-08-20',
        itemCountLabel: '3개 항목',
        status: 'reviewing',
        statusLabel: '견적 비교',
        progressLabel: '시공사 견적 접수 중',
        budgetLabel: '10,000,000원',
        preferredDateLabel: '2026-08-21',
        requestMessage: '거실 조명 교체, 바닥재 교체, 벽지 교체',
        selectedItems: ['거실 조명 교체', '바닥재 교체', '벽지 교체'],
        responseStatusLabel: '시공사 견적 접수 중',
      },
      quotes: [{
        id: 19,
        requestId: 114,
        contractorId: 19,
        contractorName: '마블건축',
        title: '의뢰 #114 리모델링 견적',
        durationDays: 3,
        totalAmount: 5_171_518,
        status: 'SUBMITTED',
        phase: 'PRELIMINARY',
        revisionCount: 0,
        items: [],
      }],
      usingLiveData: true,
      numericId: 114,
      loading: false,
      error: '',
    })
  })

  afterEach(cleanup)

  it('uses the shared request flow code and exposes a placeholder payment button without selecting a quote', () => {
    render(
      <MemoryRouter initialEntries={['/mypage/requests/114']}>
        <Routes>
          <Route path="/mypage/requests/:requestId" element={<EstimateRequestDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('의뢰 REQ-260820-000114 · 견적 ID-19')).toBeInTheDocument()
    expect(screen.getAllByText('마블건축').length).toBeGreaterThan(0)
    expect(screen.queryByText('시공사 #19')).not.toBeInTheDocument()
    expect(screen.queryByText('이 시공사 선택')).not.toBeInTheDocument()
    expect(screen.queryByText(/의뢰 #114/)).not.toBeInTheDocument()

    const paymentButton = screen.getByRole('button', { name: '결제 하기' })
    fireEvent.click(paymentButton)
    expect(paymentButton).toBeInTheDocument()
  })
})
