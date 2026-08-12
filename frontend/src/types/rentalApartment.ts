import type { PageResponse } from './api'

export interface RentalApartmentSearchItem {
  id: number
  apartmentName: string
  roadAddress: string
  lotAddress: string
  exclusiveAreaM2: number
  sggCode: string
}

export type RentalApartmentSearchPage = PageResponse<RentalApartmentSearchItem>

export interface RentalApartmentSearchParams {
  sggCode?: string
  keyword?: string
  page?: number
  size?: number
}
