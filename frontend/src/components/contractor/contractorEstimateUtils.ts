import type { ContractorEstimateCategoryId, ContractorEstimateDraft } from '@/types/contractorPortal'

export type ContractorEstimateField =
  | 'floorArea'
  | 'wallpaperArea'
  | 'lightingQuantity'
  | 'ceilingHeight'
  | 'rooms'
  | 'bathrooms'
  | 'materials'
  | 'additionalCosts'
  | 'startDate'
  | 'durationDays'

export type ContractorEstimateErrors = Partial<Record<ContractorEstimateField, string>>

export function formatWon(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function calculateEstimateTotal(draft: ContractorEstimateDraft) {
  return calculateSupplyAmount(draft) + calculateVatAmount(draft)
}

export function calculateAdditionalTotal(draft: ContractorEstimateDraft) {
  return draft.additionalCosts.reduce((sum, item) => sum + item.amount, 0)
}

export function calculateSupplyAmount(draft: ContractorEstimateDraft) {
  const categoryTotal = draft.categories.reduce((sum, category) => sum + category.sectionTotal, 0)
  return categoryTotal + calculateAdditionalTotal(draft)
}

export function calculateVatAmount(draft: ContractorEstimateDraft) {
  return Math.round(calculateSupplyAmount(draft) * 0.1)
}

export function recalculateContractorEstimate(draft: ContractorEstimateDraft): ContractorEstimateDraft {
  const categories = draft.categories.map((category) => {
    const quantity = category.id === 'floor'
      ? draft.measurement.floorArea
      : category.id === 'wallpaper'
        ? draft.measurement.wallpaperArea
        : draft.measurement.lightingQuantity
    const sectionTotal = Math.round(quantity * category.unitPrice)
    return {
      ...category,
      quantity,
      sectionTotal,
      costs: [{ id: 'material' as const, label: '선택 자재 금액', amount: sectionTotal }],
    }
  })
  const calculated = { ...draft, categories }
  return {
    ...calculated,
    supplyAmount: calculateSupplyAmount(calculated),
    vatAmount: calculateVatAmount(calculated),
    discountAmount: 0,
  }
}

export function calculateCostDetailTotal(draft: ContractorEstimateDraft, categoryId: ContractorEstimateCategoryId) {
  const category = draft.categories.find((item) => item.id === categoryId)
  return category?.costs.reduce((sum, item) => sum + item.amount, 0) ?? 0
}

export function validateContractorEstimate(draft: ContractorEstimateDraft): ContractorEstimateErrors {
  const errors: ContractorEstimateErrors = {}
  const { measurement, condition } = draft
  const positiveMeasurementFields = [
    ['floorArea', measurement.floorArea, 1000, '바닥 시공 면적'],
    ['wallpaperArea', measurement.wallpaperArea, 2000, '벽지 시공 면적'],
    ['ceilingHeight', measurement.ceilingHeight, 10, '층고'],
  ] as const

  if (!Number.isInteger(measurement.lightingQuantity) || measurement.lightingQuantity < 1 || measurement.lightingQuantity > 1000) {
    errors.lightingQuantity = '조명 수량은 1 이상 1000 이하의 정수로 입력해 주세요.'
  }

  positiveMeasurementFields.forEach(([field, value, maximum, label]) => {
    if (!Number.isFinite(value) || value <= 0 || value > maximum) {
      errors[field] = `${label}은 0보다 크고 ${maximum} 이하인 숫자로 입력해 주세요.`
    }
  })

  const countFields = [
    ['rooms', measurement.rooms, '방 개수'],
    ['bathrooms', measurement.bathrooms, '욕실 개수'],
  ] as const
  countFields.forEach(([field, value, label]) => {
    if (!Number.isInteger(value) || value < 0 || value > 20) {
      errors[field] = `${label}는 0 이상 20 이하의 정수로 입력해 주세요.`
    }
  })

  const requiredCategories: ContractorEstimateCategoryId[] = ['floor', 'wallpaper', 'lighting']
  if (requiredCategories.some((categoryId) => {
    const category = draft.categories.find((item) => item.id === categoryId)
    return !category || !category.productName || !Number.isFinite(category.unitPrice) || category.unitPrice < 0
  })) {
    errors.materials = '사용자가 선택한 바닥재·벽지·조명 단가를 불러와야 합니다.'
  }

  if (draft.additionalCosts.some((item) => !item.label.trim() || !Number.isFinite(item.amount) || item.amount < 0)) {
    errors.additionalCosts = '추가 비용의 항목명과 0원 이상의 금액을 확인해 주세요.'
  }

  if (!condition.startDate) errors.startDate = '시공 시작 예정일을 입력해 주세요.'
  if (!Number.isInteger(condition.durationDays) || condition.durationDays < 1 || condition.durationDays > 365) {
    errors.durationDays = '예상 시공 기간은 1 이상 365 이하의 정수로 입력해 주세요.'
  }

  return errors
}

export function isContractorEstimateValid(draft: ContractorEstimateDraft) {
  return Object.keys(validateContractorEstimate(draft)).length === 0
}
