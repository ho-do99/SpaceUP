import { describe, expect, it } from 'vitest'
import type { RequestResponse } from '@/types/request'
import { requestToContractorCard, requestToContractorDetail } from './contractorRequestAdapter'

const requestFixture: RequestResponse = {
  id: 1,
  region: '광주광역시 서구',
  propertyType: 'APARTMENT',
  areaM2: 84,
  budget: 10_000_000,
}

describe('contractor request adapter', () => {
  it('preserves the landlord nickname and participation status', () => {
    const result = requestToContractorCard({
      ...requestFixture,
      id: 99,
      landlordName: '시연 임대인',
      participationStatus: 'APPROVED',
    })

    expect(result.customerName).toBe('시연 임대인')
    expect(result.participationStatus).toBe('APPROVED')
  })

  it('does not inject the bundled floor plan when a live request has no image', () => {
    const result = requestToContractorDetail({ ...requestFixture, floorPlanVariantId: null }, [], null)

    expect(result.floorPlanImage).toBeUndefined()
    expect(result.hasLinkedFloorPlan).toBe(false)
  })

  it('passes the preliminary SpaceUP estimate to the contractor', () => {
    const result = requestToContractorDetail(requestFixture, [], { requestId: 1, status: 'COMPLETED', estimatedQuoteMin: 6_260_000, estimatedQuoteMax: 7_650_000 })

    expect(result.estimatedCostLabel).toBe('626~765만원')
  })

  it('passes the latest AI simulation result to the contractor', () => {
    const result = requestToContractorDetail(requestFixture, [
      { id: 22, imageType: 'AI_GENERATED', imageUrl: '/api/files/images/wood.png', sortOrder: 1 },
      { id: 10, imageType: 'PHOTO', imageUrl: '/api/files/images/before.png', sortOrder: 0 },
      { id: 11, imageType: 'AI_GENERATED', imageUrl: '/api/files/images/marble.png', sortOrder: 0 },
    ], null)

    expect(result.beforeImage).toMatch(/\/api\/files\/images\/before\.png$/)
    expect(result.afterImage).toMatch(/\/api\/files\/images\/wood\.png$/)
  })
})
