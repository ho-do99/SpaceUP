import { useEffect, useState } from 'react'
import floorFallbackImage from '@/assets/user/images/materials/floor-ai.png'
import lightingFallbackImage from '@/assets/user/images/materials/lighting-ai.png'
import wallpaperFallbackImage from '@/assets/user/images/materials/wallpaper-ai.png'
import { getMaterialCatalog } from '@/api/materialCatalogApi'
import type {
  LightingProduct,
  MaterialCategory,
  MaterialFilterId,
  MaterialProduct,
} from '@/mocks/estimateMaterials'
import type {
  CatalogMaterialProduct,
  MaterialTheme,
  MaterialWorkType,
} from '@/types/materialCatalog'

const won = new Intl.NumberFormat('ko-KR')

function parseSpec(value?: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function categoryFor(workType: MaterialWorkType): MaterialCategory {
  if (workType === 'FLOORING') return 'floor'
  if (workType === 'WALLPAPER') return 'wallpaper'
  return 'lighting'
}

function fallbackImageFor(workType: MaterialWorkType) {
  if (workType === 'FLOORING') return floorFallbackImage
  if (workType === 'WALLPAPER') return wallpaperFallbackImage
  return lightingFallbackImage
}

function tagsFor(product: CatalogMaterialProduct): MaterialFilterId[] {
  const tags: MaterialFilterId[] = []
  if (product.priceTier === 'LOW') tags.push('lowest-price')
  if (product.priceTier === 'MID') tags.push('recommended', 'popular')
  if (product.theme === 'MODERN' || product.theme === 'MARBLE') tags.push('modern')
  if (product.theme === 'WOOD') tags.push('natural')
  if (product.theme === 'WHITE') tags.push('bright')
  return tags
}

function toMaterialProduct(product: CatalogMaterialProduct): MaterialProduct {
  const price = `${won.format(product.currentPrice)}원 / ${product.saleUnit}`
  return {
    id: String(product.productId),
    category: categoryFor(product.workType),
    name: product.productName,
    brandDetail: [product.brandName, product.modelCode].filter(Boolean).join(' · '),
    materialCost: price,
    installationCost: '시공비 별도 견적',
    totalLabel: `자재 참고가 ${price}`,
    thumbnailSrc: product.imageUrl || fallbackImageFor(product.workType),
    thumbnailAlt: `${product.productName} 제품 이미지`,
    tags: tagsFor(product),
    isAiRecommended: product.priceTier === 'MID',
    popularityRank: product.priceTier === 'MID' ? 1 : product.priceTier === 'LOW' ? 2 : 3,
    priceRank: product.priceTier === 'LOW' ? 1 : product.priceTier === 'MID' ? 2 : 3,
    summaryCostRows: [
      { label: '자재 참고가', value: price },
      { label: '시공비', value: '업체 견적 시 산정' },
      { label: '가격 확인일', value: product.priceCheckedAt.slice(0, 10) },
    ],
    summaryDescription: '실제 판매처 확인가이며 구매 시점에 가격과 재고를 다시 확인해야 합니다.',
  }
}

function toLightingProduct(product: CatalogMaterialProduct): LightingProduct {
  const base = toMaterialProduct(product)
  const spec = parseSpec(product.specJson)
  const room = typeof spec.room === 'string' ? spec.room : '거실/식탁'
  const filterId = room.includes('주방')
    ? 'kitchen'
    : room.includes('침실')
      ? 'bedroom'
      : 'living-room'
  const materialPriceLabel = `자재 ${won.format(product.currentPrice)}원`
  return {
    ...base,
    category: 'lighting',
    filterId,
    roomLabel: room,
    specification: [product.materialCategory, product.modelCode].filter(Boolean).join(' · '),
    materialPriceLabel,
    removalPriceLabel: '철거비 별도',
    laborPriceLabel: '시공비 별도 견적',
  }
}

export function useMaterialProducts(
  theme: MaterialTheme,
  workType: Exclude<MaterialWorkType, 'LIGHTING'>,
  fallback: ReadonlyArray<MaterialProduct>,
) {
  const [products, setProducts] = useState<ReadonlyArray<MaterialProduct>>(fallback)

  useEffect(() => {
    let active = true
    getMaterialCatalog(theme, workType)
      .then((catalog) => {
        if (active && catalog.length > 0) setProducts(catalog.map(toMaterialProduct))
      })
      .catch(() => {
        if (active) setProducts(fallback)
      })
    return () => {
      active = false
    }
  }, [fallback, theme, workType])

  return products
}

export function useLightingProducts(
  theme: MaterialTheme,
  fallback: ReadonlyArray<LightingProduct>,
) {
  const [products, setProducts] = useState<ReadonlyArray<LightingProduct>>(fallback)

  useEffect(() => {
    let active = true
    getMaterialCatalog(theme, 'LIGHTING')
      .then((catalog) => {
        if (active && catalog.length > 0) setProducts(catalog.map(toLightingProduct))
      })
      .catch(() => {
        if (active) setProducts(fallback)
      })
    return () => {
      active = false
    }
  }, [fallback, theme])

  return products
}
