import { describe, expect, it } from 'vitest'
import { apartmentSearchResults, findMockFloorPlan } from './apartments'

describe('apartment floor plan mock matching', () => {
  it('matches by the exact apartment name and exclusive area only', () => {
    expect(findMockFloorPlan('상무센트럴아파트', 84)?.id).toBe('exclusive-84')
    expect(findMockFloorPlan('상무센트럴아파트', 84.97)).toBeNull()
    expect(findMockFloorPlan('상무센트럴자이', 84)).toBeNull()
  })

  it('keeps the existing floor plan mock database', () => {
    expect(apartmentSearchResults).toHaveLength(3)
    expect(apartmentSearchResults[0].floorPlans).toHaveLength(3)
  })
})
