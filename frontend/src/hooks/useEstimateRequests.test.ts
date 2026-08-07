import { describe, expect, it } from 'vitest'
import { toEstimateRequestSummary } from './useEstimateRequests'
import type { RequestResponse } from '@/types/request'

function request(overrides: Partial<RequestResponse> = {}): RequestResponse {
  return {
    id: 7,
    requestCode: 'REQ-007',
    region: '광주 북구',
    propertyType: 'APARTMENT',
    areaM2: 84,
    budgetMin: 10_000_000,
    budgetMax: 20_000_000,
    desiredDate: '2026-09-01',
    requestedItems: '벽지, 바닥재, 조명',
    status: 'QUOTE_REQUESTED',
    createdAt: '2026-08-06T12:34:56',
    ...overrides,
  }
}

describe('toEstimateRequestSummary', () => {
  it('maps a quote-requested backend request to the existing history card contract', () => {
    const result = toEstimateRequestSummary(request())

    expect(result).toMatchObject({
      id: '7',
      contractorId: '',
      contractorName: '여러 시공사 견적 비교',
      status: 'reviewing',
      statusLabel: '견적 비교',
      itemCountLabel: '3개 항목',
      budgetLabel: '20,000,000원',
      requestedAtLabel: '2026-08-06',
    })
    expect(result.selectedItems).toEqual(['벽지', '바닥재', '조명'])
  })

  it('shows the selected contractor after the user accepts a quote', () => {
    const result = toEstimateRequestSummary(request({ status: 'APPROVED', contractorId: 15 }))

    expect(result).toMatchObject({
      contractorId: '15',
      contractorName: '선택 시공사 #15',
      statusLabel: '시공사 확정',
      progressLabel: '최종 시공사 선택 완료',
    })
  })
})
