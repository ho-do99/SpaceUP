import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assetUrlToFile,
  createFloorPlanAnalysisNavigationState,
  getFloorPlanAnalysisNavigationState,
} from './floorPlanAnalysisFlow'

afterEach(() => vi.unstubAllGlobals())

describe('floor plan analysis flow', () => {
  it('converts a bundled asset response into a File while preserving its MIME type', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
    ))

    const file = await assetUrlToFile('/assets/apartment-floor-plan.png', 'apartment-floor-plan.png')

    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('apartment-floor-plan.png')
    expect(file.type).toBe('image/png')
  })

  it('rejects an asset response that cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

    await expect(
      assetUrlToFile('/missing.png', 'apartment-floor-plan.png'),
    ).rejects.toThrow('등록된 평면도를 불러오지 못했습니다.')
  })

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
