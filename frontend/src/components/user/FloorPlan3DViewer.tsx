import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import type { AnalysisSpaceResponse, FloorplanPoint, FloorplanVisualization, FloorplanVisualizationRoom } from '@/types/analysis'

interface Props { visualization: FloorplanVisualization; spaces: AnalysisSpaceResponse[] }
const COLORS = [0x60a5fa, 0x34d399, 0xfbbf24, 0xf472b6, 0xa78bfa, 0x22d3ee]

function polygonFor(room: FloorplanVisualizationRoom): FloorplanPoint[] | null {
  const polygon = room.viewer_polygons?.[0] ?? room.polygons?.[0]
  if (polygon && polygon.length >= 3) return polygon
  if (!room.bbox) return null
  const { x, y, width, height } = room.bbox
  return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]]
}

function labelFor(room: FloorplanVisualizationRoom) {
  return room.display_name?.trim() || room.room_name?.trim() || `공간 ${room.instance_id ?? ''}`.trim()
}

export default function FloorPlan3DViewer({ visualization, spaces }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let frame = 0
    let renderer: THREE.WebGLRenderer | null = null
    const resources: Array<{ dispose: () => void }> = []
    try {
      const imageWidth = Math.max(1, visualization.image_width)
      const imageHeight = Math.max(1, visualization.image_height)
      const scale = 12 / Math.max(imageWidth, imageHeight)
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf8fafc)
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
      camera.position.set(9, 11, 12)
      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      host.replaceChildren(renderer.domElement)
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.target.set(0, 0, 0)
      scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 2.1))
      const light = new THREE.DirectionalLight(0xffffff, 2.3)
      light.position.set(4, 10, 7)
      scene.add(light)

      visualization.rooms.forEach((room, roomIndex) => {
        const polygon = polygonFor(room)
        if (!polygon) return
        const points = polygon.map(([x, y]) => new THREE.Vector2((x - imageWidth / 2) * scale, (imageHeight / 2 - y) * scale))
        const floorGeometry = new THREE.ShapeGeometry(new THREE.Shape(points))
        floorGeometry.rotateX(-Math.PI / 2)
        const floorMaterial = new THREE.MeshStandardMaterial({ color: COLORS[roomIndex % COLORS.length], roughness: 0.78, transparent: true, opacity: 0.88, side: THREE.DoubleSide })
        resources.push(floorGeometry, floorMaterial)
        scene.add(new THREE.Mesh(floorGeometry, floorMaterial))
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 })
        resources.push(wallMaterial)
        points.forEach((start, index) => {
          const end = points[(index + 1) % points.length]
          const length = start.distanceTo(end)
          if (length < 0.01) return
          const geometry = new THREE.BoxGeometry(length, 1.35, 0.07)
          resources.push(geometry)
          const wall = new THREE.Mesh(geometry, wallMaterial)
          wall.position.set((start.x + end.x) / 2, 0.675, -(start.y + end.y) / 2)
          wall.rotation.y = -Math.atan2(end.y - start.y, end.x - start.x)
          scene.add(wall)
        })
      })
      scene.add(new THREE.GridHelper(16, 16, 0xcbd5e1, 0xe2e8f0))

      const resize = () => {
        const { width, height } = host.getBoundingClientRect()
        renderer?.setSize(Math.max(1, width), Math.max(1, height), false)
        camera.aspect = Math.max(1, width) / Math.max(1, height)
        camera.updateProjectionMatrix()
      }
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      resize()
      const animate = () => { controls.update(); renderer?.render(scene, camera); frame = requestAnimationFrame(animate) }
      animate()
      return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); resources.forEach((resource) => resource.dispose()); renderer?.dispose(); host.replaceChildren() }
    } catch {
      setError('이 브라우저에서는 3D 미리보기를 표시할 수 없습니다.')
      return () => { cancelAnimationFrame(frame); resources.forEach((resource) => resource.dispose()); renderer?.dispose() }
    }
  }, [visualization])

  if (error) return <p role="alert" className="p-4 text-center text-[11px] text-[#dc2626]">{error}</p>
  return <div><div ref={hostRef} aria-label="분석된 평면도 3D 미리보기" className="h-[270px] w-full" /><ul aria-label="분석 공간 목록" className="grid grid-cols-2 gap-1 border-t border-[#e2e8f0] p-2">{visualization.rooms.map((room, index) => { const matched = spaces.find((space) => space.spaceName === labelFor(room) || space.spaceName === room.room_name); return <li key={`${room.instance_id ?? index}-${room.room_name}`} className="flex min-w-0 items-center gap-1 text-[9px] text-[#475569]"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `#${COLORS[index % COLORS.length].toString(16).padStart(6, '0')}` }} /><span className="truncate">{labelFor(room)}{matched?.spaceAreaM2 != null ? ` ${matched.spaceAreaM2}㎡` : ''}</span></li> })}</ul></div>
}
