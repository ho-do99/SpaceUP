import type { QuoteInput } from '@/types/backendContractor'
import type { ContractorEstimateDraft } from '@/types/contractorPortal'
import {
  calculateAdditionalTotal,
  calculateSupplyAmount,
  calculateVatAmount,
} from '@/components/contractor/contractorEstimateUtils'

const quoteKey = (requestId: number) => `spaceup.quoteDraft.${requestId}.final`
const submittedQuoteKey = (estimateId: string) => `spaceup.submittedQuote.${estimateId}`

export function getStoredQuoteId(requestId: number): number | null {
  const stored = sessionStorage.getItem(quoteKey(requestId))
  if (!stored || !/^\d+$/.test(stored)) return null
  return Number(stored)
}

export function storeQuoteId(requestId: number, quoteId: number) {
  sessionStorage.setItem(quoteKey(requestId), String(quoteId))
}

export function getSubmittedQuoteId(estimateId: string): number | null {
  const stored = sessionStorage.getItem(submittedQuoteKey(estimateId))
  if (!stored || !/^\d+$/.test(stored)) return null
  const quoteId = Number(stored)
  return Number.isSafeInteger(quoteId) && quoteId > 0 ? quoteId : null
}

export function storeSubmittedQuoteId(estimateId: string, quoteId: number) {
  sessionStorage.setItem(submittedQuoteKey(estimateId), String(quoteId))
}

export function estimateDraftToQuoteInput(requestId: number, draft: ContractorEstimateDraft): QuoteInput {
  const items = [
    ...draft.categories.map((category) => ({
      category: category.label,
      description: category.productName,
      quantity: category.quantity,
      measurementUnit: category.measurementUnit,
      unitPrice: category.unitPrice,
      amount: category.sectionTotal,
    })),
    ...draft.additionalCosts.map((cost) => ({ category: '추가비용', description: cost.label, amount: cost.amount })),
  ]
  const materialCost = draft.categories.reduce((sum, category) => sum + category.sectionTotal, 0)
  const laborCost = calculateAdditionalTotal(draft)
  return {
    requestId,
    title: `의뢰 #${requestId} 리모델링 견적`,
    startDate: draft.condition.startDate,
    durationDays: draft.condition.durationDays,
    floorAreaM2: draft.measurement.floorArea,
    wallpaperAreaM2: draft.measurement.wallpaperArea,
    lightingQuantity: draft.measurement.lightingQuantity,
    ceilingHeightM: draft.measurement.ceilingHeight,
    roomCount: draft.measurement.rooms,
    bathroomCount: draft.measurement.bathrooms,
    siteCondition: draft.measurement.siteCondition,
    materialCost,
    laborCost,
    vat: calculateVatAmount(draft),
    discount: 0,
    detailContent: draft.notes,
    items: items.length ? items : [{ category: '시공', description: '현장 시공', amount: calculateSupplyAmount(draft) }],
  }
}
