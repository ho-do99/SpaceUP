export type AnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

export interface AnalysisJobResponse {
  id?: number
  requestId: number
  status: AnalysisStatus
  roomCount?: number | null
  bathroomCount?: number | null
  hasBalcony?: boolean | null
  kitchenType?: string | null
  spaceScore?: number | null
  conditionScore?: number | null
  issueTags?: string | null
  matchingScore?: number | null
  estimatedQuoteMin?: number | null
  estimatedQuoteMax?: number | null
  expectedRentIncreaseMin?: number | null
  expectedRentIncreaseMax?: number | null
  paybackPeriodMonthsMin?: number | null
  paybackPeriodMonthsMax?: number | null
  depositIncreaseMin?: number | null
  depositIncreaseMax?: number | null
  preliminaryDepositIncreaseMin?: number | null
  preliminaryDepositIncreaseMax?: number | null
  preliminaryRentIncreaseMin?: number | null
  preliminaryRentIncreaseMax?: number | null
  ceilingHeightM?: number | null
  totalFloorAreaM2?: number | null
  totalWallpaperAreaM2?: number | null
}

export interface AnalysisSpaceInput {
  spaceName: string
  spaceAreaM2?: number | null
  floorAreaM2?: number | null
  wallpaperAreaM2?: number | null
  selectedForConstruction: boolean
}

export interface AnalysisSpaceResponse extends AnalysisSpaceInput { id?: number }

export interface RecommendedProduct {
  productId: number
  productName: string
  category?: string
  spec?: string | null
  brand?: string | null
  vendorName?: string | null
  imageUrl?: string | null
  unit?: string | null
  coverageM2?: number | null
  priority?: number | null
  unitPrice: number
  quantity: number
  amount: number
  reason: string
}
