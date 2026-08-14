import type { RecommendedProduct } from '@/types/analysis'
import type { MaterialWorkType } from '@/types/materialCatalog'

export type RecommendedProductGroups = Record<MaterialWorkType, RecommendedProduct[]>

const emptyGroups = (): RecommendedProductGroups => ({
  FLOORING: [],
  WALLPAPER: [],
  LIGHTING: [],
})

export function groupRecommendedProducts(products: RecommendedProduct[]): RecommendedProductGroups {
  const groups = emptyGroups()
  products.forEach((product) => {
    const category = product.category
    if (category === 'FLOORING' || category === 'WALLPAPER' || category === 'LIGHTING') {
      groups[category].push(product)
    }
  })
  Object.values(groups).forEach((group) => group.sort((left, right) =>
    (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER)))
  return groups
}

export function sumRecommendationAmounts(products: Array<RecommendedProduct | undefined>) {
  return products.reduce<number>((total, product) => total + (product?.amount ?? 0), 0)
}
