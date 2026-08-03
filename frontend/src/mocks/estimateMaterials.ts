import floorAiImage from '@/assets/user/images/materials/floor-ai.png'
import floorHyundaiImage from '@/assets/user/images/materials/floor-hyundai.png'
import floorKccImage from '@/assets/user/images/materials/floor-kcc.png'
import lightingAiImage from '@/assets/user/images/materials/lighting-ai.png'
import wallpaperAiImage from '@/assets/user/images/materials/wallpaper-ai.png'
import wallpaperGaenariImage from '@/assets/user/images/materials/wallpaper-gaenari.png'
import wallpaperShinhanImage from '@/assets/user/images/materials/wallpaper-shinhan.png'

export type SelectableMaterialCategory = 'floor' | 'wallpaper'
export type MaterialCategory = SelectableMaterialCategory | 'lighting'
export type MaterialFilterId =
  | 'recommended'
  | 'lowest-price'
  | 'popular'
  | 'bright'
  | 'natural'
  | 'modern'

export interface MaterialCostRow {
  label: string
  value: string
}

export interface MaterialProduct {
  id: string
  category: MaterialCategory
  name: string
  brandDetail: string
  materialCost: string
  installationCost: string
  totalLabel: string
  thumbnailSrc: string
  thumbnailAlt: string
  tags: ReadonlyArray<MaterialFilterId>
  isAiRecommended: boolean
  popularityRank: number
  priceRank: number
  summaryCostRows: ReadonlyArray<MaterialCostRow>
  summaryDescription: string
}

export const materialFilters: ReadonlyArray<{ id: MaterialFilterId; label: string }> = [
  { id: 'recommended', label: '추천순' },
  { id: 'lowest-price', label: '가격 낮은순' },
  { id: 'popular', label: '인기순' },
  { id: 'bright', label: '밝은 색상' },
  { id: 'natural', label: '내추럴' },
  { id: 'modern', label: '모던' },
]

export const floorMaterialProducts: ReadonlyArray<MaterialProduct> = [
  {
    id: 'floor-ai',
    category: 'floor',
    name: '강마루 (동화자연마루)',
    brandDetail: '동화자연마루 · 밝은 오크',
    materialCost: '자재비 180 ~ 270만원(3.3㎡ 기준 3,000원)',
    installationCost: '시공비 80 ~ 120만원',
    totalLabel: '항목 예상 합계 300 ~ 450만원',
    thumbnailSrc: floorAiImage,
    thumbnailAlt: '밝은 오크 강마루 패턴',
    tags: ['recommended', 'popular', 'bright', 'natural', 'modern'],
    isAiRecommended: true,
    popularityRank: 1,
    priceRank: 2,
    summaryCostRows: [
      { label: '자재비', value: '180 ~ 270만원' },
      { label: '시공비(인건비 포함)', value: '80 ~ 120만원' },
      { label: '부자재·철거·폐기비', value: '40 ~ 60만원' },
    ],
    summaryDescription: '모던 스타일의 차분한 색감과 잘 어울려요.',
  },
  {
    id: 'floor-kcc',
    category: 'floor',
    name: 'KCC 숲 소리순',
    brandDetail: 'KCC글라스 · 내추럴 우드',
    materialCost: '자재비 160 ~ 200만원(3.3㎡ 기준 3,000원)',
    installationCost: '시공비 80 ~ 110만원',
    totalLabel: '항목 예상 합계 280 ~ 370만원',
    thumbnailSrc: floorKccImage,
    thumbnailAlt: '내추럴 우드 바닥재 패턴',
    tags: ['lowest-price', 'natural'],
    isAiRecommended: false,
    popularityRank: 2,
    priceRank: 1,
    summaryCostRows: [
      { label: '자재비', value: '160 ~ 200만원' },
      { label: '시공비(인건비 포함)', value: '80 ~ 110만원' },
      { label: '부자재·철거·폐기비', value: '40 ~ 60만원' },
    ],
    summaryDescription: '모던 스타일의 차분한 색감과 잘 어울려요.',
  },
  {
    id: 'floor-hyundai',
    category: 'floor',
    name: '현대L&C 명가 프리미엄',
    brandDetail: '현대L&C · 화이트 오크',
    materialCost: '자재비 210 ~ 250만원(3.3㎡ 기준 3,000원)',
    installationCost: '시공비 90 ~ 120만원',
    totalLabel: '항목 예상 합계 340 ~ 430만원',
    thumbnailSrc: floorHyundaiImage,
    thumbnailAlt: '화이트 오크 바닥재 패턴',
    tags: ['bright', 'modern'],
    isAiRecommended: false,
    popularityRank: 3,
    priceRank: 3,
    summaryCostRows: [
      { label: '자재비', value: '210 ~ 250만원' },
      { label: '시공비(인건비 포함)', value: '90 ~ 120만원' },
      { label: '부자재·철거·폐기비', value: '40 ~ 60만원' },
    ],
    summaryDescription: '모던 스타일의 차분한 색감과 잘 어울려요.',
  },
]

export const wallpaperMaterialProducts: ReadonlyArray<MaterialProduct> = [
  {
    id: 'wallpaper-ai',
    category: 'wallpaper',
    name: '실크벽지 (베스띠)',
    brandDetail: 'LX하우시스 · 화이트 무지',
    materialCost: '자재비 50 ~ 80만원(필요 예상 수량 15롤)',
    installationCost: '시공비 50 ~ 70만원',
    totalLabel: '항목 예상 합계 120 ~ 180만원',
    thumbnailSrc: wallpaperAiImage,
    thumbnailAlt: '화이트 무지 실크벽지 패턴',
    tags: ['recommended', 'popular', 'bright', 'modern'],
    isAiRecommended: true,
    popularityRank: 1,
    priceRank: 2,
    summaryCostRows: [
      { label: '자재비', value: '50 ~ 80만원' },
      { label: '시공비(인건비 포함)', value: '50 ~ 70만원' },
      { label: '부자재·철거·폐기비', value: '20 ~ 30만원' },
    ],
    summaryDescription: '밝고 정돈된 벽면 분위기를 강화해요.',
  },
  {
    id: 'wallpaper-shinhan',
    category: 'wallpaper',
    name: '신한벽지 리빙',
    brandDetail: '신한벽지 · 웜그레이',
    materialCost: '자재비 45 ~ 70만원(필요 예상 수량 15롤)',
    installationCost: '시공비 50 ~ 70만원',
    totalLabel: '항목 예상 합계 115 ~ 170만원',
    thumbnailSrc: wallpaperShinhanImage,
    thumbnailAlt: '웜그레이 벽지 패턴',
    tags: ['lowest-price', 'modern'],
    isAiRecommended: false,
    popularityRank: 2,
    priceRank: 1,
    summaryCostRows: [
      { label: '자재비', value: '45 ~ 70만원' },
      { label: '시공비(인건비 포함)', value: '50 ~ 70만원' },
      { label: '부자재·철거·폐기비', value: '20 ~ 30만원' },
    ],
    summaryDescription: '밝고 정돈된 벽면 분위기를 강화해요.',
  },
  {
    id: 'wallpaper-gaenari',
    category: 'wallpaper',
    name: '개나리벽지 로하스',
    brandDetail: '개나리벽지 · 베이지 패턴',
    materialCost: '자재비 60 ~ 90만원(필요 예상 수량 15롤)',
    installationCost: '시공비 55 ~ 75만원',
    totalLabel: '항목 예상 합계 135 ~ 195만원',
    thumbnailSrc: wallpaperGaenariImage,
    thumbnailAlt: '베이지 패턴 벽지',
    tags: ['natural'],
    isAiRecommended: false,
    popularityRank: 3,
    priceRank: 3,
    summaryCostRows: [
      { label: '자재비', value: '60 ~ 90만원' },
      { label: '시공비(인건비 포함)', value: '55 ~ 75만원' },
      { label: '부자재·철거·폐기비', value: '20 ~ 30만원' },
    ],
    summaryDescription: '밝고 정돈된 벽면 분위기를 강화해요.',
  },
]

export const recommendedLightingProduct: MaterialProduct = {
  id: 'lighting-ai',
  category: 'lighting',
  name: 'LED 거실등 120W (루미앤)',
  brandDetail: '루미앤 · LED 거실등 120W',
  materialCost: '자재비 20 ~ 45만원',
  installationCost: '시공비 20 ~ 40만원',
  totalLabel: '항목 예상 합계 50 ~ 120만원',
  thumbnailSrc: lightingAiImage,
  thumbnailAlt: '추천 LED 조명 색상',
  tags: ['recommended', 'modern'],
  isAiRecommended: true,
  popularityRank: 1,
  priceRank: 1,
  summaryCostRows: [
    { label: '자재비', value: '20 ~ 45만원' },
    { label: '시공비(인건비 포함)', value: '20 ~ 40만원' },
    { label: '부자재·철거·폐기비', value: '10 ~ 35만원' },
  ],
  summaryDescription: '공간의 선을 깔끔하게 살려줘요.',
}

export const defaultFloorMaterialId = floorMaterialProducts[0].id
export const defaultWallpaperMaterialId = wallpaperMaterialProducts[0].id

export function getMaterialProduct(
  products: ReadonlyArray<MaterialProduct>,
  productId: string,
) {
  return products.find((product) => product.id === productId) ?? products[0]
}

export function sortMaterialProducts(
  products: ReadonlyArray<MaterialProduct>,
  filterId: MaterialFilterId,
) {
  const copiedProducts = [...products]

  if (filterId === 'lowest-price') {
    return copiedProducts.sort((a, b) => a.priceRank - b.priceRank)
  }

  if (filterId === 'popular') {
    return copiedProducts.sort((a, b) => a.popularityRank - b.popularityRank)
  }

  if (filterId === 'recommended') {
    return copiedProducts.sort((a, b) => Number(b.isAiRecommended) - Number(a.isAiRecommended))
  }

  return copiedProducts.sort(
    (a, b) => Number(b.tags.includes(filterId)) - Number(a.tags.includes(filterId)),
  )
}
