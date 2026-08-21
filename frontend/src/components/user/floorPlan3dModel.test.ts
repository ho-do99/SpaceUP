import { describe, expect, it } from 'vitest'

import type { AnalysisSpaceResponse, FloorplanVisualization } from '@/types/analysis'
import { buildFloorPlanScene } from '@/components/user/floorPlan3dModel'

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

describe('buildFloorPlanScene', () => {
  it('keeps every room polygon and fits the scene to detected room bounds', () => {
    const visualization: FloorplanVisualization = {
      image_width: 2000,
      image_height: 1200,
      total_area_pixel_count: 2000,
      rooms: [
        {
          instance_id: 7,
          room_name: '거실',
          class_id: 4,
          pixel_count: 1200,
          included_in_total_area: true,
          bbox: { x: 400, y: 300, width: 400, height: 300 },
          viewer_polygons: [
            [[400, 300], [600, 300], [600, 600], [400, 600]],
            [[600, 420], [800, 420], [800, 600], [600, 600]],
          ],
        },
      ],
    }

    const scene = buildFloorPlanScene(visualization, spaces)

    expect(scene.rooms).toHaveLength(1)
    expect(scene.rooms[0]).toMatchObject({
      key: 'room-7',
      label: '거실',
      detected: true,
      selectable: true,
      selected: true,
      matchedSpaceId: 11,
    })
    expect(scene.rooms[0].polygons).toHaveLength(2)
    expect(scene.bounds).toEqual({ minX: 400, minY: 300, maxX: 800, maxY: 600 })
  })

  it('renders unnamed geometry as inactive without exposing a class label', () => {
    const visualization: FloorplanVisualization = {
      image_width: 640,
      image_height: 448,
      total_area_pixel_count: 1000,
      rooms: [
        {
          instance_id: 3,
          room_name: 'class_8_2',
          class_id: 8,
          pixel_count: 900,
          included_in_total_area: false,
          bbox: { x: 10, y: 20, width: 80, height: 60 },
        },
      ],
    }

    const scene = buildFloorPlanScene(visualization, [])

    expect(scene.rooms[0]).toMatchObject({
      label: '미인식 공간 3',
      detected: false,
      selectable: false,
      selected: false,
      matchedSpaceId: null,
    })
    expect(scene.rooms[0].polygons).toEqual([
      [[10, 20], [90, 20], [90, 80], [10, 80]],
    ])
  })

  it('matches an OCR display name to a space saved with the pre-OCR class name', () => {
    const visualization: FloorplanVisualization = {
      image_width: 200,
      image_height: 100,
      total_area_pixel_count: 900,
      rooms: [
        {
          instance_id: 4,
          room_name: 'class_4_1',
          display_name: '거실',
          class_id: 4,
          pixel_count: 900,
          included_in_total_area: true,
          viewer_polygons: [[[0, 0], [200, 0], [200, 100], [0, 100]]],
        },
      ],
    }

    const scene = buildFloorPlanScene(visualization, [{
      id: 99,
      spaceName: 'class_4_1',
      selectedForConstruction: true,
    }])

    expect(scene.rooms[0]).toMatchObject({
      label: '거실',
      detected: true,
      selectable: true,
      selected: true,
      matchedSpaceId: 99,
    })
  })

  it('matches names after removing whitespace differences', () => {
    const visualization: FloorplanVisualization = {
      image_width: 200,
      image_height: 100,
      total_area_pixel_count: 900,
      rooms: [{
        instance_id: 1,
        room_name: '주방/식당',
        class_id: 6,
        pixel_count: 900,
        included_in_total_area: true,
        viewer_polygons: [[[0, 0], [200, 0], [200, 100], [0, 100]]],
      }],
    }

    const scene = buildFloorPlanScene(visualization, [{
      id: 42,
      sortOrder: 0,
      spaceName: '주방 / 식당',
      selectedForConstruction: true,
    }])

    expect(scene.rooms[0]).toMatchObject({ selectable: true, matchedSpaceId: 42 })
  })


  it('matches repeated OCR names to different saved space instances', () => {
    const visualization: FloorplanVisualization = {
      image_width: 200,
      image_height: 100,
      total_area_pixel_count: 1800,
      rooms: [
        {
          instance_id: 1,
          room_name: '발코니',
          class_id: 7,
          pixel_count: 900,
          included_in_total_area: false,
          viewer_polygons: [[[0, 0], [100, 0], [100, 100], [0, 100]]],
        },
        {
          instance_id: 2,
          room_name: '발코니',
          class_id: 7,
          pixel_count: 900,
          included_in_total_area: false,
          viewer_polygons: [[[100, 0], [200, 0], [200, 100], [100, 100]]],
        },
      ],
    }
    const duplicateSpaces: AnalysisSpaceResponse[] = [
      { id: 21, spaceName: '발코니', selectedForConstruction: true },
      { id: 22, spaceName: '발코니', selectedForConstruction: false },
    ]

    const scene = buildFloorPlanScene(visualization, duplicateSpaces)

    expect(scene.rooms.map((room) => room.matchedSpaceId)).toEqual([21, 22])
  })
  it('deduplicates a shared wall drawn in opposite directions', () => {
    const visualization: FloorplanVisualization = {
      image_width: 200,
      image_height: 100,
      total_area_pixel_count: 2000,
      rooms: [
        {
          instance_id: 1,
          room_name: '거실',
          class_id: 4,
          pixel_count: 1000,
          included_in_total_area: true,
          viewer_polygons: [[[0, 0], [100, 0], [100, 100], [0, 100]]],
        },
        {
          instance_id: 2,
          room_name: '침실1',
          class_id: 5,
          pixel_count: 1000,
          included_in_total_area: true,
          viewer_polygons: [[[100, 0], [200, 0], [200, 100], [100, 100]]],
        },
      ],
    }

    const scene = buildFloorPlanScene(visualization, [])

    expect(scene.wallSegments).toHaveLength(7)
    expect(scene.wallSegments.filter((wall) => (
      wall.start[0] === 100 && wall.end[0] === 100
    ))).toHaveLength(1)
  })

  it('splits a long wall before deduplicating collinear shared sections', () => {
    const visualization: FloorplanVisualization = {
      image_width: 200,
      image_height: 100,
      total_area_pixel_count: 2000,
      rooms: [
        {
          instance_id: 1,
          room_name: '거실',
          class_id: 4,
          pixel_count: 1000,
          included_in_total_area: true,
          viewer_polygons: [[[0, 0], [100, 0], [100, 100], [0, 100]]],
        },
        {
          instance_id: 2,
          room_name: '침실1',
          class_id: 5,
          pixel_count: 1000,
          included_in_total_area: true,
          viewer_polygons: [[[100, 0], [200, 0], [200, 100], [100, 100], [100, 50]]],
        },
      ],
    }

    const scene = buildFloorPlanScene(visualization, [])
    const shared = scene.wallSegments.filter((wall) => (
      wall.start[0] === 100 && wall.end[0] === 100
    ))

    expect(shared).toHaveLength(2)
    expect(scene.wallSegments).toHaveLength(8)
  })
})
