import { beforeEach, describe, expect, it } from 'vitest'
import { contractorDefaultEstimateDraft } from '@/mocks/contractorPortalMockData'
import { createLiveContractorEstimateDraft } from './contractorQuoteAdapter'
import {
  estimateDraftToQuoteInput,
  getStoredQuoteId,
  getSubmittedQuoteId,
  storeQuoteId,
  storeSubmittedQuoteId,
} from './quoteDraft'
import { applySelectedMaterials } from './contractorFinalEstimate'
import { recalculateContractorEstimate } from '@/components/contractor/contractorEstimateUtils'
import type { CatalogMaterialProduct } from '@/types/materialCatalog'

const material = (
  productId: number,
  workType: CatalogMaterialProduct['workType'],
  unitPrice: number,
): CatalogMaterialProduct => ({
  productId,
  workType,
  materialCategory: '시연 자재',
  theme: 'MODERN',
  priceTier: 'MID',
  brandName: 'SpaceUP',
  productName: `${workType} 자재`,
  saleUnit: workType === 'LIGHTING' ? '개' : 'BOX',
  currentPrice: unitPrice,
  normalizedPriceM2: workType === 'LIGHTING' ? null : unitPrice,
  priceCheckedAt: '2026-08-20T00:00:00',
})

describe('quoteDraft', () => {
  beforeEach(() => sessionStorage.clear())

  it('keeps one backend quote id per request', () => {
    storeQuoteId(7, 101)
    expect(getStoredQuoteId(7)).toBe(101)
  })

  it('keeps the backend quote id separate from the displayed estimate number', () => {
    storeSubmittedQuoteId('SP-20260724-001', 37)
    expect(getSubmittedQuoteId('SP-20260724-001')).toBe(37)
  })

  it('maps the contractor editor draft to the backend quote contract', () => {
    const input = estimateDraftToQuoteInput(7, contractorDefaultEstimateDraft)
    expect(input.requestId).toBe(7)
    expect(input.items.length).toBeGreaterThan(0)
    expect(input.durationDays).toBe(contractorDefaultEstimateDraft.condition.durationDays)
  })

  it('persists measurements, material formulas, additional costs, and calculated VAT', () => {
    const selected = applySelectedMaterials(createLiveContractorEstimateDraft('108'), {
      floor: material(1, 'FLOORING', 30_000),
      wallpaper: material(2, 'WALLPAPER', 10_000),
      lighting: material(3, 'LIGHTING', 50_000),
    })
    const draft = recalculateContractorEstimate({
      ...selected,
      measurement: {
        floorArea: 10,
        wallpaperArea: 20,
        lightingQuantity: 2,
        ceilingHeight: 2.4,
        rooms: 3,
        bathrooms: 1,
        siteCondition: '철거 필요',
      },
      additionalCosts: [{ id: 'labor', label: '총 시공비', amount: 400_000 }],
    })

    expect(estimateDraftToQuoteInput(108, draft)).toMatchObject({
      floorAreaM2: 10,
      wallpaperAreaM2: 20,
      lightingQuantity: 2,
      materialCost: 600_000,
      laborCost: 400_000,
      vat: 100_000,
      items: [
        { category: '바닥재', quantity: 10, measurementUnit: '㎡', unitPrice: 30_000, amount: 300_000 },
        { category: '벽지', quantity: 20, measurementUnit: '㎡', unitPrice: 10_000, amount: 200_000 },
        { category: '조명', quantity: 2, measurementUnit: '개', unitPrice: 50_000, amount: 100_000 },
        { category: '추가비용', description: '총 시공비', amount: 400_000 },
      ],
    })
  })
})
