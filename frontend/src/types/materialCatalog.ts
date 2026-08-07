export type MaterialTheme = 'MODERN' | 'WOOD' | 'WHITE' | 'MARBLE'
export type MaterialWorkType = 'WALLPAPER' | 'FLOORING' | 'LIGHTING'
export type MaterialPriceTier = 'LOW' | 'MID' | 'HIGH'

export interface CatalogMaterialProduct {
  productId: number
  workType: MaterialWorkType
  materialCategory: string
  theme: MaterialTheme
  priceTier: MaterialPriceTier
  brandName?: string | null
  productName: string
  modelCode?: string | null
  productUrl?: string | null
  imageUrl?: string | null
  saleUnit: string
  coveragePerUnitM2?: number | null
  currentPrice: number
  normalizedPriceM2?: number | null
  specJson?: string | null
  priceCheckedAt: string
}
