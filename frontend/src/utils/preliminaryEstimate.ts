import type { RecommendedProduct } from '@/types/analysis'

export interface PreliminaryEstimateBreakdown {
  materialCost: number
  demolitionCost: number
  laborCost: number
  totalCost: number
  estimateMin: number
  estimateMax: number
}

const roundToTenThousand = (amount: number) => Math.round(amount / 10_000) * 10_000

export function calculatePreliminaryEstimate(
  products: Array<RecommendedProduct | undefined>,
): PreliminaryEstimateBreakdown {
  const materialCost = products.reduce<number>((total, product) => total + (product?.amount ?? 0), 0)
  const demolitionCost = roundToTenThousand(materialCost * 0.12)
  const laborCost = roundToTenThousand(materialCost * 0.3)
  const totalCost = materialCost + demolitionCost + laborCost

  return {
    materialCost,
    demolitionCost,
    laborCost,
    totalCost,
    estimateMin: roundToTenThousand(totalCost * 0.9),
    estimateMax: roundToTenThousand(totalCost * 1.1),
  }
}
