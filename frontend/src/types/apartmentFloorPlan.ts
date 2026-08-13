import type { PageResponse } from './api'

export interface FloorPlanVariant {
  id: number
  exclusiveAreaM2: number
  supplyAreaM2: number | null
  exclusivePyeong: number | null
  supplyPyeong: number | null
  typeLabel: string | null
  roomCount: number | null
  floorPlanImageUrl: string | null
}

export interface ApartmentFloorPlanSearchItem {
  id: number
  name: string
  roadAddress: string
  lotAddress: string
  region: string
  variants: FloorPlanVariant[]
}

export type ApartmentFloorPlanSearchPage = PageResponse<ApartmentFloorPlanSearchItem>

export interface ApartmentFloorPlanSearchParams {
  keyword?: string
  page?: number
  size?: number
}
