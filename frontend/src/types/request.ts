import type { MaterialTheme } from '@/types/materialCatalog'

export type PropertyType = 'APARTMENT' | 'VILLA' | string
export type RequestImageType = 'FLOOR_PLAN' | 'PHOTO' | 'AI_GENERATED'

export interface RequestCreateInput {
  region: string
  propertyType: PropertyType
  areaM2: number
  deposit?: number
  monthlyRent?: number
  targetRent?: number
  budget?: number
  budgetMin?: number
  budgetMax?: number
  desiredDate?: string
  requestedItems?: string
}

export type RequestUpdateInput = Partial<RequestCreateInput> & {
  selectedTheme?: MaterialTheme
  selectedWallpaperProductId?: number
  selectedFlooringProductId?: number
  selectedLightingProductId?: number
}

export interface RequestResponse extends RequestCreateInput {
  id: number
  requestCode?: string
  landlordId?: number
  landlordName?: string
  selectedTheme?: MaterialTheme | null
  selectedWallpaperProductId?: number | null
  selectedFlooringProductId?: number | null
  selectedLightingProductId?: number | null
  contractorId?: number | null
  status?: string
  rejectReason?: string | null
  rejectReasonDetail?: string | null
  matchingScore?: number | null
  acceptedQuoteAmount?: number | null
  participationStatus?: 'INVITED' | 'APPROVED' | 'REJECTED' | 'SELECTED' | 'CLOSED' | null
	floorPlanVariantId?: number | null
	contractorNames?: string[]
  createdAt?: string
  lastActivityAt?: string
}

export interface RequestImageInput {
  imageType: RequestImageType
  imageUrl: string
}

export interface RequestImageResponse extends RequestImageInput {
  id: number
  sortOrder: number
}
