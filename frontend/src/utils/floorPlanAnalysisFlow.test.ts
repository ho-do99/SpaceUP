import { describe, expect, it } from 'vitest'
import {
  createFloorPlanAnalysisNavigationState,
  getFloorPlanAnalysisNavigationState,
} from './floorPlanAnalysisFlow'

describe('floor plan analysis flow', () => {
  it('creates and validates an in-memory router state containing the original File', () => {
    const file = new File(['floor-plan'], 'floor-plan.png', { type: 'image/png' })
    const state = createFloorPlanAnalysisNavigationState(
      file,
      { id: 7, imageUrl: '/api/files/images/floor-plan.png' },
      'https://spaceup.test/api/files/images/floor-plan.png',
    )

    expect(getFloorPlanAnalysisNavigationState(state)).toEqual(state)
    expect(getFloorPlanAnalysisNavigationState({ ...state, floorPlanFile: undefined })).toBeNull()
  })
})
