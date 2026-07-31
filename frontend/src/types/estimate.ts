export interface EstimateItem {
  name: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Estimate {
  id: number
  analysisId: number
  items: EstimateItem[]
  totalAmount: number
  createdAt: string
}

export interface EstimateRequest {
  analysisId: number
  options: string[]
}
