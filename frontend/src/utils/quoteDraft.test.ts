import { beforeEach, describe, expect, it } from 'vitest'
import { contractorDefaultEstimateDraft } from '@/mocks/contractorPortalMockData'
import { estimateDraftToQuoteInput, getStoredQuoteId, storeQuoteId } from './quoteDraft'

describe('quoteDraft', () => {
  beforeEach(() => sessionStorage.clear())

  it('keeps one backend quote id per request', () => {
    storeQuoteId(7, 101)
    expect(getStoredQuoteId(7)).toBe(101)
  })

  it('maps the contractor editor draft to the backend quote contract', () => {
    const input = estimateDraftToQuoteInput(7, contractorDefaultEstimateDraft)
    expect(input.requestId).toBe(7)
    expect(input.items.length).toBeGreaterThan(0)
    expect(input.durationDays).toBe(contractorDefaultEstimateDraft.condition.durationDays)
  })
})
