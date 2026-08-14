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

export interface AnalysisSpaceResponse extends AnalysisSpaceInput { id?: number; sortOrder?: number }

export interface AnalysisJobEditInput {
  roomCount?: number
  bathroomCount?: number
  hasBalcony?: boolean
  kitchenType?: string
  exclusiveAreaM2?: number
  ceilingHeightM?: number
}

export interface RecommendedProduct {
  productId: number
  productName: string
  category?: string
  spec?: string | null
  brand?: string | null
  /** @deprecated 자재업체명이 아니며 현재 brand와 같은 호환 값이다. */
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

export interface InteriorImageGenerateInput {
  style: string
  referenceImageUrl?: string
}

export interface InteriorImageGenerateResponse {
  imageUrls: string[]
}

export type InteriorImageGenerationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface InteriorImageGenerationStatusResponse {
  status: InteriorImageGenerationStatus
  imageUrls: string[]
}

export type FloorplanPoint = [number, number]

export interface FloorplanBoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FloorplanVisualizationRoom {
  instance_id?: number
  room_name: string
  display_name?: string
  class_id: number
  pixel_count: number
  included_in_total_area: boolean
  bbox?: FloorplanBoundingBox
  polygons?: FloorplanPoint[][]
  viewer_polygons?: FloorplanPoint[][]
}

export interface FloorplanVisualization {
  image_width: number
  image_height: number
  total_area_pixel_count: number
  rooms: FloorplanVisualizationRoom[]
}
