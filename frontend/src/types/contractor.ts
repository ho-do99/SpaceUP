export interface Contractor {
  id: number
  name: string
  region: string
  specialties: string[]
  rating?: number
  portfolioImageUrls: string[]
}

export interface ContractorSearchParams {
  region?: string
  specialty?: string
}
