import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FloorPlan3DViewer from '@/components/user/FloorPlanInteractive3DViewer'
import { cameraDistanceToFit, createFloorGeometry } from '@/components/user/floorPlan3dRendering'
import type { AnalysisSpaceResponse, FloorplanVisualization } from '@/types/analysis'

const visualization: FloorplanVisualization = {
  image_width: 640,
  image_height: 448,
  total_area_pixel_count: 2000,
  rooms: [
    {
      instance_id: 1,
      room_name: '거실',
      class_id: 4,
      pixel_count: 1100,
      included_in_total_area: true,
      viewer_polygons: [[[20, 20], [320, 20], [320, 300], [20, 300]]],
    },
    {
      instance_id: 2,
      room_name: 'class_8_2',
      class_id: 8,
      pixel_count: 900,
      included_in_total_area: false,
      viewer_polygons: [[[320, 20], [500, 20], [500, 180], [320, 180]]],
    },
  ],
}

const spaces: AnalysisSpaceResponse[] = [
  {
    id: 11,
    sortOrder: 1,
    spaceName: '거실',
    spaceAreaM2: 23,
    floorAreaM2: 23,
    wallpaperAreaM2: 40,
    selectedForConstruction: true,
  },
]

describe('FloorPlan3DViewer', () => {
  afterEach(cleanup)

  it('offers only OCR-detected rooms for selection and sends the matched space id', () => {
    const onToggleSpace = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <FloorPlan3DViewer
        visualization={visualization}
        spaces={spaces}
        onToggleSpace={onToggleSpace}
      />,
    )

    const livingRoom = screen.getByRole('button', { name: '거실 선택 해제' })
    expect(livingRoom).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('class_8_2')).not.toBeInTheDocument()

    fireEvent.click(livingRoom)
    expect(onToggleSpace).toHaveBeenCalledWith(11)
    consoleError.mockRestore()
  })

  it('keeps the floor on the same positive Z axis used by walls and labels', () => {
    const geometry = createFloorGeometry([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
    ])
    geometry.rotateX(-Math.PI / 2)
    const positions = geometry.getAttribute('position')
    const zValues = Array.from({ length: positions.count }, (_, index) => positions.getZ(index))
    expect(Math.min(...zValues)).toBeCloseTo(0)
    expect(Math.max(...zValues)).toBeCloseTo(3)
    geometry.dispose()
  })

  it('places the camera far enough to contain the complete plan bounds', () => {
    const extent = 11.5
    const distance = cameraDistanceToFit(extent, extent, 1)
    const boundingRadius = Math.hypot(extent, extent, 0.9) / 2
    expect(distance * Math.sin((34 * Math.PI / 180) / 2)).toBeGreaterThan(boundingRadius)
  })
})
