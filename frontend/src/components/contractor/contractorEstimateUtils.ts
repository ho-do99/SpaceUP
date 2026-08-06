import type { ContractorEstimateDraft } from '@/types/contractorPortal'

export type ContractorEstimateField =
  | 'floorArea'
  | 'wallpaperArea'
  | 'ceilingHeight'
  | 'rooms'
  | 'bathrooms'
  | 'startDate'
  | 'durationDays'
  | 'depositPercent'
  | 'interimPercent'
  | 'balancePercent'
  | 'paymentTotal'

export type ContractorEstimateErrors = Partial<Record<ContractorEstimateField, string>>

export function formatWon(amount: number) {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function calculateEstimateTotal(draft: ContractorEstimateDraft) {
  const categoryTotal = draft.categories.reduce((sum, category) => sum + category.sectionTotal, 0)
  const additionalTotal = draft.additionalCosts.reduce((sum, item) => sum + item.amount, 0)
  return categoryTotal + additionalTotal - draft.discountAmount
}

export function calculateAdditionalTotal(draft: ContractorEstimateDraft) {
  return draft.additionalCosts.reduce((sum, item) => sum + item.amount, 0)
}

export function calculateCostDetailTotal(draft: ContractorEstimateDraft, categoryId: 'floor' | 'wallpaper') {
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

  if (!condition.startDate) errors.startDate = '시공 시작 예정일을 입력해 주세요.'
  if (!Number.isInteger(condition.durationDays) || condition.durationDays < 1 || condition.durationDays > 365) {
    errors.durationDays = '예상 시공 기간은 1 이상 365 이하의 정수로 입력해 주세요.'
  }

  const paymentFields = [
    ['depositPercent', condition.paymentTerms.depositPercent, '계약금'],
    ['interimPercent', condition.paymentTerms.interimPercent, '중도금'],
    ['balancePercent', condition.paymentTerms.balancePercent, '잔금'],
  ] as const
  paymentFields.forEach(([field, value, label]) => {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      errors[field] = `${label} 비율은 0 이상 100 이하의 정수로 입력해 주세요.`
    }
  })

  const paymentTotal = condition.paymentTerms.depositPercent
    + condition.paymentTerms.interimPercent
    + condition.paymentTerms.balancePercent
  if (paymentTotal !== 100) errors.paymentTotal = '계약금·중도금·잔금의 합은 100%여야 합니다.'

  return errors
}

export function isContractorEstimateValid(draft: ContractorEstimateDraft) {
  return Object.keys(validateContractorEstimate(draft)).length === 0
}
