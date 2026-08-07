import { useMemo, useState, type ReactNode } from 'react'
import { EstimateFlowContext } from '@/contexts/estimateFlowContext'
import {
  defaultFloorMaterialId,
  defaultLightingMaterialId,
  defaultWallpaperMaterialId,
} from '@/mocks/estimateMaterials'

const FLOOR_KEY = 'spaceup.selectedFloorMaterialId'
const WALLPAPER_KEY = 'spaceup.selectedWallpaperMaterialId'
const LIGHTING_KEY = 'spaceup.selectedLightingMaterialId'

function storedSelection(key: string, fallback: string) {
  return sessionStorage.getItem(key) || fallback
}

interface EstimateFlowProviderProps {
  children: ReactNode
}

export default function EstimateFlowProvider({ children }: EstimateFlowProviderProps) {
  const [selectedFloorId, setSelectedFloorId] = useState(() => storedSelection(FLOOR_KEY, defaultFloorMaterialId))
  const [selectedWallpaperId, setSelectedWallpaperId] = useState(() => storedSelection(WALLPAPER_KEY, defaultWallpaperMaterialId))
  const [selectedLightingId, setSelectedLightingId] = useState(() => storedSelection(LIGHTING_KEY, defaultLightingMaterialId))

  const selectFloor = (id: string) => {
    sessionStorage.setItem(FLOOR_KEY, id)
    setSelectedFloorId(id)
  }
  const selectWallpaper = (id: string) => {
    sessionStorage.setItem(WALLPAPER_KEY, id)
    setSelectedWallpaperId(id)
  }
  const selectLighting = (id: string) => {
    sessionStorage.setItem(LIGHTING_KEY, id)
    setSelectedLightingId(id)
  }

  const value = useMemo(
    () => ({
      selectedFloorId,
      selectedWallpaperId,
      selectedLightingId,
      selectFloor,
      selectWallpaper,
      selectLighting,
    }),
    [selectedFloorId, selectedLightingId, selectedWallpaperId],
  )

  return <EstimateFlowContext.Provider value={value}>{children}</EstimateFlowContext.Provider>
}
