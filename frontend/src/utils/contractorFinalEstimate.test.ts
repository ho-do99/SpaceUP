import { describe, expect, it } from 'vitest'
import type { CatalogMaterialProduct } from '@/types/materialCatalog'
import { createLiveContractorEstimateDraft } from './contractorQuoteAdapter'
import { applySelectedMaterials } from './contractorFinalEstimate'
import {
  calculateEstimateTotal,
  calculateSupplyAmount,
  calculateVatAmount,
  recalculateContractorEstimate,
} from '@/components/contractor/contractorEstimateUtils'

const product = (overrides: Partial<CatalogMaterialProduct>): CatalogMaterialProduct => ({
  productId: 1,
  workType: 'FLOORING',
  materialCategory: '강마루',
  theme: 'MODERN',
  priceTier: 'MID',
  productName: '선택 자재',
  saleUnit: 'BOX',
  currentPrice: 100_000,
  priceCheckedAt: '2026-08-20T00:00:00',
  ...overrides,
})

describe('final estimate calculation', () => {
  it('uses measured quantities and the selected material unit prices', () => {
    const base = applySelectedMaterials(createLiveContractorEstimateDraft('108'), {
      floor: product({ normalizedPriceM2: 30_000 }),
      wallpaper: product({ productId: 2, workType: 'WALLPAPER', normalizedPriceM2: 10_000 }),
      lighting: product({ productId: 3, workType: 'LIGHTING', currentPrice: 50_000 }),
    })
    const calculated = recalculateContractorEstimate({
      ...base,
      measurement: { ...base.measurement, floorArea: 59, wallpaperArea: 168, lightingQuantity: 4 },
      additionalCosts: [
        { id: 'labor', label: '총 시공비', amount: 1_000_000 },
        { id: 'waste', label: '폐기물비', amount: 100_000 },
      ],
    })

    expect(calculated.categories.map((item) => item.sectionTotal)).toEqual([1_770_000, 1_680_000, 200_000])
    expect(calculateSupplyAmount(calculated)).toBe(4_750_000)
    expect(calculateVatAmount(calculated)).toBe(475_000)
    expect(calculateEstimateTotal(calculated)).toBe(5_225_000)
  })
})
