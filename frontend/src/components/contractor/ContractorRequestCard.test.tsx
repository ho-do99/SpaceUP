import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ContractorRequest } from '@/types/contractorPortal'
import ContractorRequestCard from './ContractorRequestCard'

const request: ContractorRequest = {
  requestId: '151',
  customerName: '시연 임대인',
  maskedPhone: '계약 전 비공개',
  property: {
    region: '광주광역시 서구',
    address: '광주광역시 서구',
    propertyType: '아파트',
    areaLabel: '74㎡',
  },
  budgetLabel: '500만원',
  estimatedCostLabel: '240~293만원',
  matchScore: 93,
  desiredSchedule: '2026-08-27',
  status: 'reviewing',
  statusLabel: '검토 중',
  lastActivityLabel: '2026-08-25',
}

describe('ContractorRequestCard', () => {
  afterEach(cleanup)

  it.each(['default', 'in-progress', 'matched'] as const)(
    'shows the customer name instead of the numeric request id in the %s card heading',
    (variant) => {
      render(
        <MemoryRouter>
          <ContractorRequestCard
            request={variant === 'matched'
              ? { ...request, status: 'matched', projectTitle: '리모델링 프로젝트', contractSummary: '계약 완료', progressSummary: '진행 중' }
              : request}
            variant={variant}
          />
        </MemoryRouter>,
      )

      expect(screen.getByText('시연 임대인')).toBeInTheDocument()
      expect(screen.queryByText('151')).not.toBeInTheDocument()
    },
  )
})
