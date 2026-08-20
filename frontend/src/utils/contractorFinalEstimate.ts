import type { CatalogMaterialProduct } from '@/types/materialCatalog'
import type {
  ContractorEstimateCategory,
  ContractorEstimateCategoryId,
  ContractorEstimateDraft,
} from '@/types/contractorPortal'
import { recalculateContractorEstimate } from '@/components/contractor/contractorEstimateUtils'

export interface SelectedFinalEstimateMaterials {
  floor: CatalogMaterialProduct
  wallpaper: CatalogMaterialProduct
  lighting: CatalogMaterialProduct
}

function squareMeterUnitPrice(product: CatalogMaterialProduct) {
  if (product.normalizedPriceM2 != null) return Math.round(product.normalizedPriceM2)
  if (product.coveragePerUnitM2 != null && product.coveragePerUnitM2 > 0) {
    return Math.round(product.currentPrice / product.coveragePerUnitM2)
  }
  return 0
}

function productLabel(product: CatalogMaterialProduct) {
  return [product.brandName, product.productName].filter(Boolean).join(' · ')
}

function category(
  id: ContractorEstimateCategoryId,
  label: string,
  product: CatalogMaterialProduct,
  measurementUnit: '㎡' | '개',
  unitPrice: number,
): ContractorEstimateCategory {
  return {
    id,
    label,
    productName: productLabel(product),
    quantity: 0,
    measurementUnit,
    unitPrice,
    costs: [],
    sectionTotal: 0,
  }
}

export function categoriesFromSelectedMaterials(
  materials: SelectedFinalEstimateMaterials,
): ContractorEstimateCategory[] {
  return [
    category('floor', '바닥재', materials.floor, '㎡', squareMeterUnitPrice(materials.floor)),
    category('wallpaper', '벽지', materials.wallpaper, '㎡', squareMeterUnitPrice(materials.wallpaper)),
    category('lighting', '조명', materials.lighting, '개', Math.round(materials.lighting.currentPrice)),
  ]
}

export function applySelectedMaterials(
  draft: ContractorEstimateDraft,
  materials: SelectedFinalEstimateMaterials,
) {
  return recalculateContractorEstimate({
    ...draft,
    categories: categoriesFromSelectedMaterials(materials),
  })
}
