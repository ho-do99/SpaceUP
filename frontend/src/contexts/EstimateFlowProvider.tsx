import { useMemo, useState, type ReactNode } from 'react'
import { EstimateFlowContext } from '@/contexts/estimateFlowContext'
import {
  defaultFloorMaterialId,
  defaultWallpaperMaterialId,
} from '@/mocks/estimateMaterials'

interface EstimateFlowProviderProps {
  children: ReactNode
}

export default function EstimateFlowProvider({ children }: EstimateFlowProviderProps) {
  const [selectedFloorId, setSelectedFloorId] = useState(defaultFloorMaterialId)
  const [selectedWallpaperId, setSelectedWallpaperId] = useState(defaultWallpaperMaterialId)

  const value = useMemo(
    () => ({
      selectedFloorId,
      selectedWallpaperId,
      selectFloor: setSelectedFloorId,
      selectWallpaper: setSelectedWallpaperId,
    }),
    [selectedFloorId, selectedWallpaperId],
  )

  return <EstimateFlowContext.Provider value={value}>{children}</EstimateFlowContext.Provider>
}
