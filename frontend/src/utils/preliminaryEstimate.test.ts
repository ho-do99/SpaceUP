import { describe, expect, it } from 'vitest'
import type { RecommendedProduct } from '@/types/analysis'
import { calculatePreliminaryEstimate } from './preliminaryEstimate'

const product = (amount: number): RecommendedProduct => ({
  productId: amount,
  productName: '테스트 자재',
  unitPrice: amount,
  quantity: 1,
  amount,
  reason: '테스트',
})

describe('calculatePreliminaryEstimate', () => {
  it('derives demolition, labor, and total costs from the area-based material recommendations', () => {
    expect(calculatePreliminaryEstimate(
      [product(2_400_000), product(1_800_000), product(600_000)],
      { floorAreaM2: 30, wallpaperAreaM2: 70, lightingQuantity: 1 },
    ))
      .toEqual({
        materialCost: 4_800_000,
        demolitionCost: 640_000,
        laborCost: 1_510_000,
        totalCost: 6_950_000,
        estimateMin: 6_260_000,
        estimateMax: 7_650_000,
        floorAreaM2: 30,
        wallpaperAreaM2: 70,
      })
  })
})
