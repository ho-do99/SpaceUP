import { useMemo, useState, type ReactNode } from 'react'
import { EstimateFlowContext } from '@/contexts/estimateFlowContext'
import {
  defaultFloorMaterialId,
  defaultLightingMaterialId,
  defaultWallpaperMaterialId,
} from '@/mocks/estimateMaterials'

interface EstimateFlowProviderProps {
  children: ReactNode
}

export default function EstimateFlowProvider({ children }: EstimateFlowProviderProps) {
  const [selectedFloorId, setSelectedFloorId] = useState(defaultFloorMaterialId)
  const [selectedWallpaperId, setSelectedWallpaperId] = useState(defaultWallpaperMaterialId)
  const [selectedLightingId, setSelectedLightingId] = useState(defaultLightingMaterialId)

  const value = useMemo(
    () => ({
      selectedFloorId,
      selectedWallpaperId,
      selectedLightingId,
      selectFloor: setSelectedFloorId,
      selectWallpaper: setSelectedWallpaperId,
      selectLighting: setSelectedLightingId,
    }),
    [selectedFloorId, selectedLightingId, selectedWallpaperId],
  )

  return <EstimateFlowContext.Provider value={value}>{children}</EstimateFlowContext.Provider>
}
