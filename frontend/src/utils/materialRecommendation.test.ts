import { describe, expect, it } from 'vitest'

import type { RecommendedProduct } from '@/types/analysis'
import { groupRecommendedProducts, sumRecommendationAmounts } from './materialRecommendation'

const products: RecommendedProduct[] = [
  { productId: 2, productName: '바닥 B', category: 'FLOORING', priority: 2, unitPrice: 100, quantity: 2, amount: 200, reason: '비교' },
  { productId: 1, productName: '바닥 A', category: 'FLOORING', priority: 1, unitPrice: 120, quantity: 2, amount: 240, reason: '추천' },
  { productId: 3, productName: '벽지 A', category: 'WALLPAPER', priority: 1, unitPrice: 80, quantity: 3, amount: 240, reason: '추천' },
  { productId: 4, productName: '조명 A', category: 'LIGHTING', priority: 1, unitPrice: 60, quantity: 1, amount: 60, reason: '추천' },
]

describe('materialRecommendation', () => {
  it('groups products by work type and orders each group by recommendation priority', () => {
    const grouped = groupRecommendedProducts(products)

    expect(grouped.FLOORING.map((product) => product.productId)).toEqual([1, 2])
    expect(grouped.WALLPAPER[0].productId).toBe(3)
    expect(grouped.LIGHTING[0].productId).toBe(4)
  })

  it('adds the literal analyzed amounts without recalculating server quantities', () => {
    const grouped = groupRecommendedProducts(products)

    expect(sumRecommendationAmounts([
      grouped.FLOORING[0],
      grouped.WALLPAPER[0],
      grouped.LIGHTING[0],
    ])).toBe(540)
  })
})
