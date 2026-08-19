import type { RecommendedProduct } from '@/types/analysis'

export interface PreliminaryEstimateBreakdown {
  materialCost: number
  demolitionCost: number
  laborCost: number
  totalCost: number
  estimateMin: number
  estimateMax: number
  floorAreaM2: number
  wallpaperAreaM2: number
}

export interface PreliminaryEstimateArea {
  floorAreaM2: number
  wallpaperAreaM2: number
  lightingQuantity: number
}

const FLOOR_DEMOLITION_RATE = 12_000
const WALLPAPER_REMOVAL_RATE = 4_000
const FLOOR_INSTALLATION_LABOR_RATE = 25_000
const WALLPAPER_INSTALLATION_LABOR_RATE = 10_000
const LIGHTING_INSTALLATION_LABOR_RATE = 60_000
const roundToTenThousand = (amount: number) => Math.round(amount / 10_000) * 10_000
const validArea = (area: number) => Number.isFinite(area) && area > 0 ? area : 0

export function calculatePreliminaryEstimate(
  products: Array<RecommendedProduct | undefined>,
  area: PreliminaryEstimateArea,
): PreliminaryEstimateBreakdown {
  const materialCost = products.reduce<number>((total, product) => total + (product?.amount ?? 0), 0)
  const floorAreaM2 = validArea(area.floorAreaM2)
  const wallpaperAreaM2 = validArea(area.wallpaperAreaM2)
  const lightingQuantity = Number.isFinite(area.lightingQuantity) && area.lightingQuantity > 0 ? area.lightingQuantity : 0
  const demolitionCost = roundToTenThousand(
    floorAreaM2 * FLOOR_DEMOLITION_RATE + wallpaperAreaM2 * WALLPAPER_REMOVAL_RATE,
  )
  const laborCost = roundToTenThousand(
    floorAreaM2 * FLOOR_INSTALLATION_LABOR_RATE
      + wallpaperAreaM2 * WALLPAPER_INSTALLATION_LABOR_RATE
      + lightingQuantity * LIGHTING_INSTALLATION_LABOR_RATE,
  )
  const totalCost = materialCost + demolitionCost + laborCost

  return {
    floorAreaM2,
    wallpaperAreaM2,
    materialCost,
    demolitionCost,
    laborCost,
    totalCost,
    estimateMin: roundToTenThousand(totalCost * 0.9),
    estimateMax: roundToTenThousand(totalCost * 1.1),
  }
}
