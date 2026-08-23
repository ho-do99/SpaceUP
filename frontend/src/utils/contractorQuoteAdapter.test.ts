import { describe, expect, it } from 'vitest'
import { quoteLifecycleStatus, quoteToContractorSentEstimate } from './contractorQuoteAdapter'
import type { QuoteResponse } from '@/types/backendContractor'
import type { RequestResponse } from '@/types/request'

const quote: QuoteResponse = {
  id: 41, requestId: 99, contractorId: 7, contractorName: '시연 시공사', title: '실견적',
  startDate: '2026-09-01', durationDays: 3, totalAmount: 5500000, status: 'SUBMITTED',
  phase: 'FINAL', validUntil: '2026-09-15', revisionCount: 0,
  items: [{ category: '바닥재', description: '강마루', amount: 5500000 }],
}
const request = {
  id: 99, requestCode: 'REQ-99', landlordName: '시연 임대인', region: '광주광역시 서구',
  propertyType: 'APARTMENT', areaM2: 84, status: 'QUOTE_REQUESTED',
} as RequestResponse

describe('contractor quote adapter', () => {
  it('maps a live quote and landlord nickname without demo literals', () => {
    const result = quoteToContractorSentEstimate(quote, request)
    expect(result.estimateId).toBe('41')
    expect(result.customerName).toBe('시연 임대인')
    expect(result.finalAmount).toBe(5500000)
    expect(result.initialValidUntil).toBe('2026-09-15')
  })

  it('treats backend revision one as the first submission', () => {
    expect(quoteLifecycleStatus({ ...quote, revisionCount: 1 })).toBe('SUBMITTED')
  })

  it('treats backend revision two as a resubmission', () => {
    expect(quoteLifecycleStatus({ ...quote, revisionCount: 2 })).toBe('RESUBMITTED')
  })
})
