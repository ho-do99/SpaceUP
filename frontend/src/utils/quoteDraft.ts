import type { QuoteInput } from '@/types/backendContractor'
import type { ContractorEstimateDraft } from '@/types/contractorPortal'

const quoteKey = (requestId: number) => `spaceup.quoteDraft.${requestId}`

export function getStoredQuoteId(requestId: number): number | null {
  const stored = sessionStorage.getItem(quoteKey(requestId))
  if (!stored || !/^\d+$/.test(stored)) return null
  return Number(stored)
}

export function storeQuoteId(requestId: number, quoteId: number) {
  sessionStorage.setItem(quoteKey(requestId), String(quoteId))
}

export function estimateDraftToQuoteInput(requestId: number, draft: ContractorEstimateDraft): QuoteInput {
  const items = [
    ...draft.categories.flatMap((category) => category.costs.map((cost) => ({
      category: `${category.label}-${cost.label}`,
      description: category.productName,
      amount: cost.amount,
    }))),
    ...draft.additionalCosts.map((cost) => ({ category: '추가비용', description: cost.label, amount: cost.amount })),
  ]
  const materialCost = draft.categories.reduce((sum, category) =>
    sum + (category.costs.find((cost) => cost.id === 'material')?.amount ?? 0), 0)
  const laborCost = draft.categories.reduce((sum, category) =>
    sum + (category.costs.find((cost) => cost.id === 'labor')?.amount ?? 0), 0)
  return {
    requestId,
    title: `의뢰 #${requestId} 리모델링 견적`,
    startDate: draft.condition.startDate,
    durationDays: draft.condition.durationDays,
    materialCost,
    laborCost,
    vat: draft.vatAmount,
    discount: draft.discountAmount,
    detailContent: draft.notes,
    items: items.length ? items : [{ category: '시공', description: '현장 시공', amount: draft.supplyAmount }],
  }
}
