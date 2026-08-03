import { createContext } from 'react'

export interface EstimateFlowContextValue {
  selectedFloorId: string
  selectedWallpaperId: string
  selectFloor: (id: string) => void
  selectWallpaper: (id: string) => void
}

export const EstimateFlowContext = createContext<EstimateFlowContextValue | null>(null)
