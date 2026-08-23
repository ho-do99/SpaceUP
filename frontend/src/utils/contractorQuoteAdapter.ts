import type { QuoteResponse } from '@/types/backendContractor'
import type { ContractorEstimateCategory, ContractorEstimateCategoryId, ContractorEstimateDraft, ContractorEstimateLifecycleStatus, ContractorSentEstimate } from '@/types/contractorPortal'
import type { RequestResponse } from '@/types/request'

export function quoteLifecycleStatus(quote: QuoteResponse): ContractorEstimateLifecycleStatus {
  if (quote.status === 'ACCEPTED') return 'ACCEPTED'
  if (quote.revisionRequestNote) return 'REVISION_REQUESTED'
  return quote.revisionCount > 1 ? 'RESUBMITTED' : 'SUBMITTED'
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
  const measurement = {
    floorArea: quote.floorAreaM2 ?? request.areaM2,
    wallpaperArea: quote.wallpaperAreaM2 ?? 0,
    lightingQuantity: quote.lightingQuantity ?? 0,
    ceilingHeight: quote.ceilingHeightM ?? 0,
    rooms: quote.roomCount ?? 0,
    bathrooms: quote.bathroomCount ?? 0,
    siteCondition: quote.siteCondition ?? '',
  }
  const categoryDefinitions: Array<{ id: ContractorEstimateCategoryId; label: string; quantity: number; unit: '㎡' | '개' }> = [
    { id: 'floor', label: '바닥재', quantity: measurement.floorArea, unit: '㎡' },
    { id: 'wallpaper', label: '벽지', quantity: measurement.wallpaperArea, unit: '㎡' },
    { id: 'lighting', label: '조명', quantity: measurement.lightingQuantity, unit: '개' },
  ]
  const categories = categoryDefinitions.flatMap<ContractorEstimateCategory>((definition) => {
    const matched = quote.items.filter((item) =>
      item.category === definition.label || item.category.startsWith(`${definition.label}-`))
    if (!matched.length) return []
    const sectionTotal = matched.reduce((sum, item) => sum + item.amount, 0)
    const quantity = matched.find((item) => item.quantity != null)?.quantity ?? definition.quantity
    const unitPrice = matched.find((item) => item.unitPrice != null)?.unitPrice
      ?? (quantity > 0 ? Math.round(sectionTotal / quantity) : 0)
    return [{
      id: definition.id,
      label: definition.label,
      productName: matched.find((item) => item.description)?.description ?? '',
      quantity,
      measurementUnit: matched.find((item) => item.measurementUnit)?.measurementUnit === '개' ? '개' : definition.unit,
      unitPrice,
      costs: matched.map((item, index) => ({
        id: index === 0 ? 'material' : 'other',
        label: item.category.includes('-') ? item.category.split('-').slice(1).join('-') : '선택 자재 금액',
        amount: item.amount,
      })),
      sectionTotal,
    }]
  })
  const additionalCosts = quote.items
    .filter((item) => item.category === '추가비용')
    .map((item, index) => ({ id: `quote-${index}`, label: item.description || `추가 비용 ${index + 1}`, amount: item.amount }))
  const supplyAmount = categories.reduce((sum, category) => sum + category.sectionTotal, 0)
    + additionalCosts.reduce((sum, item) => sum + item.amount, 0)
  return {
    requestId: String(request.id),
    measurement,
    categories,
    additionalCosts,
    discountAmount: 0,
    vatIncluded: true,
    supplyAmount,
    vatAmount: quote.vat ?? Math.max(0, quote.totalAmount - supplyAmount),
    condition: {
      startDate,
      durationDays,
      completionDate,
      validityDays: 0,
      paymentTerms: { depositPercent: 0, interimPercent: 0, balancePercent: 100 },
      warrantyLabel: '별도 협의',
    },
    notes: quote.detailContent || '',
  }
}

export function createLiveContractorEstimateDraft(requestId: string): ContractorEstimateDraft {
  return {
    requestId,
    measurement: { floorArea: 0, wallpaperArea: 0, lightingQuantity: 0, ceilingHeight: 0, rooms: 0, bathrooms: 0, siteCondition: '' },
    categories: [
      { id: 'floor', label: '바닥재', productName: '', quantity: 0, measurementUnit: '㎡', unitPrice: 0, costs: [], sectionTotal: 0 },
      { id: 'wallpaper', label: '벽지', productName: '', quantity: 0, measurementUnit: '㎡', unitPrice: 0, costs: [], sectionTotal: 0 },
      { id: 'lighting', label: '조명', productName: '', quantity: 0, measurementUnit: '개', unitPrice: 0, costs: [], sectionTotal: 0 },
    ],
    additionalCosts: [
      { id: 'labor', label: '총 시공비', amount: 0 },
      { id: 'demolition', label: '철거비', amount: 0 },
      { id: 'waste', label: '폐기물비', amount: 0 },
      { id: 'transport', label: '운반비', amount: 0 },
    ], discountAmount: 0, vatIncluded: true, supplyAmount: 0, vatAmount: 0,
    condition: { startDate: '', durationDays: 0, completionDate: '', validityDays: 14, paymentTerms: { depositPercent: 20, interimPercent: 40, balancePercent: 40 }, warrantyLabel: '별도 협의' },
    notes: '',
  }
}
