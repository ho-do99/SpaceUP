import type { FloorplanPoint } from '@/types/analysis'

const WALL_EPSILON = 0.01

function pointKey(point: FloorplanPoint) {
  return `${Math.round(point[0] * 100) / 100},${Math.round(point[1] * 100) / 100}`
}

function wallKey(start: FloorplanPoint, end: FloorplanPoint) {
  const startKey = pointKey(start)
  const endKey = pointKey(end)
  return startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
}

function segmentParameter(point: FloorplanPoint, start: FloorplanPoint, end: FloorplanPoint) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const lengthSquared = dx * dx + dy * dy
  return lengthSquared === 0
    ? 0
    : ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared
}

function pointIsOnSegment(point: FloorplanPoint, start: FloorplanPoint, end: FloorplanPoint) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  if (length <= WALL_EPSILON) return false

  const cross = dx * (point[1] - start[1]) - dy * (point[0] - start[0])
  if (Math.abs(cross) / length > WALL_EPSILON) return false

  const parameter = segmentParameter(point, start, end)
  return parameter >= -WALL_EPSILON && parameter <= 1 + WALL_EPSILON
}

export function splitAndDeduplicateWalls(polygons: FloorplanPoint[][]) {
  const rawSegments = polygons.flatMap((polygon) => polygon.flatMap((start, index) => {
    const end = polygon[(index + 1) % polygon.length]
    return start[0] === end[0] && start[1] === end[1] ? [] : [{ start, end }]
  }))
  const endpoints = rawSegments.flatMap(({ start, end }) => [start, end])
  const walls = new Map<string, { start: FloorplanPoint; end: FloorplanPoint }>()

  rawSegments.forEach(({ start, end }) => {
    const breakpoints = new Map<string, FloorplanPoint>()
    endpoints.forEach((point) => {
      if (pointIsOnSegment(point, start, end)) breakpoints.set(pointKey(point), point)
    })
    const sorted = [...breakpoints.values()].sort((left, right) => (
      segmentParameter(left, start, end) - segmentParameter(right, start, end)
    ))

    sorted.slice(0, -1).forEach((segmentStart, index) => {
      const segmentEnd = sorted[index + 1]
      if (Math.hypot(segmentEnd[0] - segmentStart[0], segmentEnd[1] - segmentStart[1]) <= WALL_EPSILON) return
      const key = wallKey(segmentStart, segmentEnd)
      if (!walls.has(key)) walls.set(key, { start: segmentStart, end: segmentEnd })
    })
  })

  return [...walls.values()]
}
