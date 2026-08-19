import type { QuoteResponse } from '@/types/backendContractor'
import type { ContractorEstimateDraft, ContractorEstimateLifecycleStatus, ContractorSentEstimate } from '@/types/contractorPortal'
import type { RequestResponse } from '@/types/request'

export function quoteLifecycleStatus(quote: QuoteResponse): ContractorEstimateLifecycleStatus {
  if (quote.status === 'ACCEPTED') return 'ACCEPTED'
  if (quote.revisionRequestNote) return 'REVISION_REQUESTED'
  return quote.revisionCount > 0 ? 'RESUBMITTED' : 'SUBMITTED'
}

export function quoteToContractorSentEstimate(quote: QuoteResponse, request: RequestResponse): ContractorSentEstimate {
  return {
    estimateId: String(quote.id),
    requestId: String(request.id),
    customerName: request.landlordName || '사용자',
    contractorName: quote.contractorName,
    region: request.region,
    propertyType: request.propertyType.toUpperCase().includes('APART') ? '아파트' : '빌라',
    areaLabel: `${request.areaM2}㎡`,
    address: request.region,
    submittedDate: request.lastActivityAt?.slice(0, 10) || request.createdAt?.slice(0, 10) || '-',
    initialValidUntil: quote.validUntil || '-',
    finalAmount: quote.totalAmount,
  }
}

export function quoteToContractorEstimateDraft(quote: QuoteResponse, request: RequestResponse): ContractorEstimateDraft {
  const startDate = quote.startDate || ''
  const durationDays = quote.durationDays ?? 0
  const completionDate = startDate && durationDays > 0
    ? new Date(new Date(`${startDate}T00:00:00`).getTime() + (durationDays - 1) * 86_400_000).toISOString().slice(0, 10)
    : ''
  return {
    requestId: String(request.id),
    measurement: {
      floorArea: request.areaM2,
      wallpaperArea: 0,
      ceilingHeight: 0,
      rooms: 0,
      bathrooms: 0,
      siteCondition: '',
    },
    categories: [],
    additionalCosts: quote.items.map((item, index) => ({ id: `quote-${index}`, label: [item.category, item.description].filter(Boolean).join(' · '), amount: item.amount })),
    discountAmount: 0,
    vatIncluded: true,
    supplyAmount: quote.totalAmount,
    vatAmount: 0,
    condition: {
      startDate,
      durationDays,
      completionDate,
      validityDays: 0,
      paymentTerms: { depositPercent: 0, interimPercent: 0, balancePercent: 100 },
      warrantyLabel: '별도 협의',
    },
    notes: quote.title || '',
  }
}

export function createLiveContractorEstimateDraft(requestId: string): ContractorEstimateDraft {
  return {
    requestId,
    measurement: { floorArea: 0, wallpaperArea: 0, ceilingHeight: 0, rooms: 0, bathrooms: 0, siteCondition: '' },
    categories: [
      { id: 'floor', label: '바닥재', productName: '', area: 0, unitPrice: 0, costs: [], sectionTotal: 0 },
      { id: 'wallpaper', label: '벽지', productName: '', area: 0, unitPrice: 0, costs: [], sectionTotal: 0 },
    ],
    additionalCosts: [], discountAmount: 0, vatIncluded: true, supplyAmount: 0, vatAmount: 0,
    condition: { startDate: '', durationDays: 0, completionDate: '', validityDays: 14, paymentTerms: { depositPercent: 20, interimPercent: 40, balancePercent: 40 }, warrantyLabel: '별도 협의' },
    notes: '',
  }
}
