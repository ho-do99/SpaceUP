import type {
  AnalysisSpaceResponse,
  FloorplanBoundingBox,
  FloorplanPoint,
  FloorplanVisualization,
  FloorplanVisualizationRoom,
} from '@/types/analysis'

import { splitAndDeduplicateWalls } from './floorPlan3dWalls'

const MIN_RENDERABLE_ROOM_PIXELS = 800

export interface FloorPlanSceneBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface FloorPlanWallSegment {
  start: FloorplanPoint
  end: FloorplanPoint
}

export interface FloorPlanSceneRoom {
  key: string
  label: string
  detected: boolean
  selectable: boolean
  selected: boolean
  matchedSpaceId: number | null
  classId: number
  polygons: FloorplanPoint[][]
  center: FloorplanPoint
  source: FloorplanVisualizationRoom
}

export interface FloorPlanSceneModel {
  rooms: FloorPlanSceneRoom[]
  bounds: FloorPlanSceneBounds
  wallSegments: FloorPlanWallSegment[]
}

export function isDetectedSpaceName(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''
  return Boolean(normalized) && !/^class_/i.test(normalized)
}

function detectedRoomName(room: FloorplanVisualizationRoom) {
  const displayName = room.display_name?.trim()
  if (isDetectedSpaceName(displayName)) return displayName as string
  const roomName = room.room_name?.trim()
  return isDetectedSpaceName(roomName) ? roomName : null
}

function bboxPolygon(bbox: FloorplanBoundingBox): FloorplanPoint[] {
  const { x, y, width, height } = bbox
  return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]]
}

function validPolygons(polygons: FloorplanPoint[][] | undefined) {
  return (polygons ?? []).filter((polygon) => polygon.length >= 3)
}

function roomPolygons(room: FloorplanVisualizationRoom) {
  const viewerPolygons = validPolygons(room.viewer_polygons)
  if (viewerPolygons.length) return viewerPolygons
  const polygons = validPolygons(room.polygons)
  if (polygons.length) return polygons
  return room.bbox && room.bbox.width > 0 && room.bbox.height > 0
    ? [bboxPolygon(room.bbox)]
    : []
}

function polygonArea(polygon: FloorplanPoint[]) {
  return Math.abs(polygon.reduce((area, point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    return area + point[0] * next[1] - next[0] * point[1]
  }, 0) / 2)
}

function roomCenter(polygons: FloorplanPoint[][]): FloorplanPoint {
  const polygon = [...polygons].sort((left, right) => polygonArea(right) - polygonArea(left))[0]
  const sum = polygon.reduce(([x, y], point) => [x + point[0], y + point[1]], [0, 0])
  return [sum[0] / polygon.length, sum[1] / polygon.length]
}

function wallsFor(rooms: FloorPlanSceneRoom[]): FloorPlanWallSegment[] {
  return splitAndDeduplicateWalls(rooms.flatMap((room) => room.polygons))
}

function boundsFor(rooms: FloorPlanSceneRoom[], visualization: FloorplanVisualization) {
  const points = rooms.flatMap((room) => room.polygons.flat())
  if (!points.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: Math.max(1, visualization.image_width),
      maxY: Math.max(1, visualization.image_height),
    }
  }
  return {
    minX: Math.min(...points.map(([x]) => x)),
    minY: Math.min(...points.map(([, y]) => y)),
    maxX: Math.max(...points.map(([x]) => x)),
    maxY: Math.max(...points.map(([, y]) => y)),
  }
}

export function buildFloorPlanScene(
  visualization: FloorplanVisualization,
  spaces: AnalysisSpaceResponse[],
): FloorPlanSceneModel {
  const matchedSpaceIndexes = new Set<number>()
  const rooms = visualization.rooms.flatMap<FloorPlanSceneRoom>((room, index) => {
    const polygons = roomPolygons(room)
    if (room.class_id === 0 || room.pixel_count <= MIN_RENDERABLE_ROOM_PIXELS || !polygons.length) return []

    const detectedName = detectedRoomName(room)
    let matchedSpaceIndex = -1
    if (detectedName) {
      matchedSpaceIndex = spaces.findIndex((space, spaceIndex) => (
        !matchedSpaceIndexes.has(spaceIndex)
        && isDetectedSpaceName(space.spaceName)
        && (
          space.spaceName === detectedName
          || (isDetectedSpaceName(room.room_name) && space.spaceName === room.room_name)
        )
      ))
      if (matchedSpaceIndex >= 0) matchedSpaceIndexes.add(matchedSpaceIndex)
    }
    const matchedSpace = matchedSpaceIndex >= 0 ? spaces[matchedSpaceIndex] : undefined
    const instanceLabel = room.instance_id ?? index + 1

    return [{
      key: `room-${instanceLabel}`,
      label: detectedName ?? `미인식 공간 ${instanceLabel}`,
      detected: detectedName !== null,
      selectable: matchedSpace?.id != null,
      selected: matchedSpace?.id != null ? matchedSpace.selectedForConstruction : false,
      matchedSpaceId: matchedSpace?.id ?? null,
      classId: room.class_id,
      polygons,
      center: roomCenter(polygons),
      source: room,
    }]
  })

  return {
    rooms,
    bounds: boundsFor(rooms, visualization),
    wallSegments: wallsFor(rooms),
  }
}
