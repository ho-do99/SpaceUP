import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import type { AnalysisSpaceResponse, FloorplanPoint, FloorplanVisualization } from '@/types/analysis'
import { buildFloorPlanScene, type FloorPlanSceneRoom } from './floorPlan3dModel'

import { cameraDistanceToFit, createFloorGeometry } from './floorPlan3dRendering'
interface FloorPlanInteractive3DViewerProps {
  visualization: FloorplanVisualization
  spaces: AnalysisSpaceResponse[]
  onToggleSpace: (spaceId: number) => void
}

const ROOM_COLORS = [
  '#91a868',
  '#d99a53',
  '#c98169',
  '#b9aa91',
  '#cf8fac',
  '#72b8b2',
  '#d3bd66',
  '#8faac7',
]

function colorForRoom(room: FloorPlanSceneRoom) {
  if (room.selected) return '#2563eb'
  return ROOM_COLORS[Math.abs(room.colorIndex) % ROOM_COLORS.length]
}


export default function FloorPlanInteractive3DViewer({
  visualization,
  spaces,
  onToggleSpace,
}: FloorPlanInteractive3DViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState(false)
  const sceneModel = useMemo(
    () => buildFloorPlanScene(visualization, spaces),
    [visualization, spaces],
  )
  const selectableRooms = sceneModel.rooms.filter((room) => room.selectable)
  const unidentifiedCount = sceneModel.rooms.filter((room) => !room.detected).length

  useEffect(() => {
    const host = hostRef.current
    const labelsHost = labelsRef.current
    if (!host || !labelsHost || sceneModel.rooms.length === 0) return

    setRenderError(false)

    let renderer: THREE.WebGLRenderer | null = null
    let animationFrame = 0
    let resizeObserver: ResizeObserver | null = null
    const disposables: Array<{ dispose: () => void }> = []
    const labels: Array<{ element: HTMLSpanElement; position: THREE.Vector3 }> = []
    const floorTargets: THREE.Mesh[] = []
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f4f7fc')

    const { bounds } = sceneModel
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerY = (bounds.minY + bounds.maxY) / 2
    const boundsWidth = bounds.maxX - bounds.minX
    const boundsHeight = bounds.maxY - bounds.minY
    const sourceSize = Math.max(boundsWidth, boundsHeight, 1)
    const scale = 11.5 / sourceSize
    const toWorld = (point: FloorplanPoint) => ({
      x: (point[0] - centerX) * scale,
      y: (point[1] - centerY) * scale,
    })

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputColorSpace = THREE.SRGBColorSpace
      host.appendChild(renderer.domElement)

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200)
      const worldWidth = boundsWidth * scale
      const worldDepth = boundsHeight * scale
      const cameraDirection = new THREE.Vector3(0.68, 1.18, 0.8).normalize()
      const initialDistance = cameraDistanceToFit(worldWidth, worldDepth, 1, camera.fov)
      camera.position.copy(cameraDirection).multiplyScalar(initialDistance)
      camera.lookAt(0, 0, 0)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.08
      controls.minDistance = 7
      controls.maxDistance = 60
      controls.maxPolarAngle = Math.PI * 0.48
      controls.target.set(0, 0.25, 0)

      scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 2.15))
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
      keyLight.position.set(-5, 12, 8)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.set(1024, 1024)
      scene.add(keyLight)

      const groundGeometry = new THREE.PlaneGeometry(18, 18)
      const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f7fc, roughness: 1 })
      const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.08
      ground.receiveShadow = true
      scene.add(ground)
      disposables.push(groundGeometry, groundMaterial)

      sceneModel.rooms.forEach((room) => {
        const roomColor = colorForRoom(room)
        room.polygons.forEach((polygon) => {
          const worldPolygon = polygon.map(toWorld)
          const geometry = createFloorGeometry(worldPolygon)
          geometry.rotateX(-Math.PI / 2)
          const material = new THREE.MeshStandardMaterial({
            color: roomColor,
            emissive: room.selected ? new THREE.Color('#1d4ed8') : new THREE.Color('#000000'),
            emissiveIntensity: room.selected ? 0.22 : 0,
            opacity: 0.9,
            transparent: false,
            roughness: 0.82,
            metalness: 0,
          })
          const floor = new THREE.Mesh(geometry, material)
          floor.position.y = 0.035
          floor.receiveShadow = true
          floor.userData.spaceId = room.matchedSpaceId
          floor.userData.selectable = room.selectable
          scene.add(floor)
          disposables.push(geometry, material)
          if (floor.userData.selectable) floorTargets.push(floor)
        })

        if (room.detected) {
          const label = document.createElement('span')
          label.textContent = room.label
          label.className = room.selected
            ? 'pointer-events-none absolute rounded-md bg-blue-600 px-2 py-1 text-[10px] font-bold text-white shadow-md'
            : 'pointer-events-none absolute rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800 shadow-md ring-1 ring-slate-200'
          label.style.transform = 'translate(-50%, -50%)'
          labelsHost.appendChild(label)
          const center = toWorld(room.center)
          labels.push({ element: label, position: new THREE.Vector3(center.x, 0.22, center.y) })
        }
      })

      sceneModel.wallSegments.forEach((wall) => {
        const start = toWorld(wall.start)
        const end = toWorld(wall.end)
        const dx = end.x - start.x
        const dz = end.y - start.y
        const length = Math.hypot(dx, dz)
        if (length < 0.001) return

        const wallGeometry = new THREE.BoxGeometry(length, 0.82, 0.075)
        const wallMaterial = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.72,
        })
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
        wallMesh.position.set((start.x + end.x) / 2, 0.44, (start.y + end.y) / 2)
        wallMesh.rotation.y = -Math.atan2(dz, dx)
        wallMesh.castShadow = true
        wallMesh.receiveShadow = true
        scene.add(wallMesh)
        disposables.push(wallGeometry, wallMaterial)

        const capGeometry = new THREE.BoxGeometry(length + 0.025, 0.055, 0.09)
        const capMaterial = new THREE.MeshStandardMaterial({ color: 0x64706c, roughness: 0.85 })
        const cap = new THREE.Mesh(capGeometry, capMaterial)
        cap.position.set((start.x + end.x) / 2, 0.88, (start.y + end.y) / 2)
        cap.rotation.y = wallMesh.rotation.y
        scene.add(cap)
        disposables.push(capGeometry, capMaterial)
      })

      const resize = () => {
        if (!renderer) return
        const width = Math.max(host.clientWidth, 1)
        const height = Math.max(host.clientHeight, 1)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        const distance = cameraDistanceToFit(worldWidth, worldDepth, camera.aspect, camera.fov)
        camera.position.copy(cameraDirection).multiplyScalar(distance)
        camera.updateProjectionMatrix()
        controls.target.set(0, 0.25, 0)
        controls.update()
      }
      resize()
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(host)
      } else {
        window.addEventListener('resize', resize)
      }

      const updateLabels = () => {
        const width = host.clientWidth
        const height = host.clientHeight
        labels.forEach(({ element, position }) => {
          const projected = position.clone().project(camera)
          const visible = projected.z > -1 && projected.z < 1
          element.style.display = visible ? 'block' : 'none'
          element.style.left = `${(projected.x * 0.5 + 0.5) * width}px`
          element.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`
        })
      }

      const animate = () => {
        controls.update()
        updateLabels()
        renderer?.render(scene, camera)
        animationFrame = window.requestAnimationFrame(animate)
      }
      animate()

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      let pointerDown: { x: number; y: number } | null = null
      const handlePointerDown = (event: PointerEvent) => {
        pointerDown = { x: event.clientX, y: event.clientY }
      }
      const handlePointerUp = (event: PointerEvent) => {
        if (!renderer || !pointerDown) return
        const travel = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y)
        pointerDown = null
        if (travel > 8) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hit = raycaster.intersectObjects(floorTargets, false)[0]
        const spaceId = hit?.object.userData.spaceId
        if (typeof spaceId === 'number') onToggleSpace(spaceId)
      }
      renderer.domElement.addEventListener('pointerdown', handlePointerDown)
      renderer.domElement.addEventListener('pointerup', handlePointerUp)

      return () => {
        window.cancelAnimationFrame(animationFrame)
        resizeObserver?.disconnect()
        window.removeEventListener('resize', resize)
        renderer?.domElement.removeEventListener('pointerdown', handlePointerDown)
        renderer?.domElement.removeEventListener('pointerup', handlePointerUp)
        controls.dispose()
        labelsHost.replaceChildren()
        disposables.forEach((resource) => resource.dispose())
        renderer?.dispose()
        renderer?.domElement.remove()
      }
    } catch (error) {
      console.error('3D floor-plan rendering failed', error)
      setRenderError(true)
      labelsHost.replaceChildren()
      renderer?.dispose()
      renderer?.domElement.remove()
      disposables.forEach((resource) => resource.dispose())
      return undefined
    }
  }, [onToggleSpace, sceneModel])

  return (
    <div className="space-y-3">
      <div className="relative h-[270px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div ref={hostRef} className="absolute inset-0" aria-label="3D 평면도" />
        <div ref={labelsRef} className="pointer-events-none absolute inset-0 overflow-hidden" />
        {renderError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500" role="alert">
            이 환경에서는 3D 미리보기를 표시할 수 없습니다. 아래 공간 선택은 계속 사용할 수 있습니다.
          </div>
        )}
      </div>

      {selectableRooms.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="탐지된 공간 선택">
          {selectableRooms.map((room) => {
            const matchedSpace = spaces.find((space) => space.id === room.matchedSpaceId)
            return (
              <button
                key={`${room.key}-${room.matchedSpaceId}`}
                type="button"
                aria-label={`${room.label} ${room.selected ? '선택 해제' : '선택'}`}
                aria-pressed={room.selected}
                onClick={() => onToggleSpace(room.matchedSpaceId!)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  room.selected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm ring-1 ring-black/5"
                  style={{ backgroundColor: colorForRoom(room) }}
                />
                {room.label}
                {matchedSpace?.spaceAreaM2 != null && (
                  <span className={room.selected ? 'text-blue-100' : 'text-slate-400'}>
                    {matchedSpace.spaceAreaM2.toFixed(2)}m²
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {unidentifiedCount > 0 && (
        <p className="text-[11px] text-slate-400">
          이름을 확인할 수 없는 공간 {unidentifiedCount}개는 바닥 형상만 표시됩니다.
        </p>
      )}
    </div>
  )
}
