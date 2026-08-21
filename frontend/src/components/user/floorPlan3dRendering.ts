import * as THREE from 'three'

export function cameraDistanceToFit(width: number, depth: number, aspect: number, verticalFov = 34) {
  const verticalHalfFov = THREE.MathUtils.degToRad(verticalFov) / 2
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(aspect, 0.01))
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov)
  const boundingRadius = Math.hypot(width, depth, 0.9) / 2

  return Math.max(13, (boundingRadius / Math.sin(limitingHalfFov)) * 1.08)
}

export function createFloorGeometry(points: Array<{ x: number; y: number }>) {
  const shape = new THREE.Shape()
  points.forEach((point, index) => {
    if (index === 0) shape.moveTo(point.x, -point.y)
    else shape.lineTo(point.x, -point.y)
  })
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}
