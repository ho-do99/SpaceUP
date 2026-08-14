import floorAiImage from '@/assets/user/images/materials/floor-ai.png'
import floorHyundaiImage from '@/assets/user/images/materials/floor-hyundai.png'
import floorKccImage from '@/assets/user/images/materials/floor-kcc.png'
import lightingAiImage from '@/assets/user/images/materials/lighting-ai.png'
import wallpaperAiImage from '@/assets/user/images/materials/wallpaper-ai.png'
import wallpaperGaenariImage from '@/assets/user/images/materials/wallpaper-gaenari.png'
import wallpaperShinhanImage from '@/assets/user/images/materials/wallpaper-shinhan.png'

export type SelectableMaterialCategory = 'floor' | 'wallpaper' | 'lighting'
export type MaterialCategory = SelectableMaterialCategory

export type MaterialFilterId =
  | 'recommended'
  | 'lowest-price'
  | 'popular'
  | 'bright'
  | 'natural'
  | 'modern'

export type LightingFilterId =
  | 'recommended'
  | 'all'
  | 'living-room'
  | 'bedroom'
  | 'kitchen'
  | 'entrance-bathroom'

export interface MaterialCostRow {
  label: string
  value: string
}

export interface MaterialProduct {
  id: string
  unitPrice?: number
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

export interface LightingProduct extends MaterialProduct {
  category: 'lighting'
  filterId: Exclude<LightingFilterId, 'recommended' | 'all'>
  roomLabel: string
  specification: string
  materialPriceLabel: string
  removalPriceLabel: string
  laborPriceLabel: string
}

export const lightingFilters: ReadonlyArray<{
  id: LightingFilterId
  label: string
}> = [
  { id: 'recommended', label: '추천' },
  { id: 'all', label: '전체' },
  { id: 'living-room', label: '거실등' },
  { id: 'bedroom', label: '방등' },
  { id: 'kitchen', label: '주방등' },
  { id: 'entrance-bathroom', label: '현관·욕실등' },
]

export const materialFilters: ReadonlyArray<{
  id: MaterialFilterId
  label: string
}> = [
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
    installationCost: '시공비 40 ~ 60만원',
    totalLabel: '항목 예상 합계 220 ~ 330만원',
    thumbnailSrc: floorAiImage,
    thumbnailAlt: '밝은 오크 강마루 패턴',
    tags: ['recommended', 'popular', 'bright', 'natural', 'modern'],
    isAiRecommended: true,
    popularityRank: 1,
    priceRank: 2,
    summaryCostRows: [
      { label: '자재비', value: '180 ~ 270만원' },
      { label: '시공비', value: '40 ~ 60만원' },
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
    totalLabel: '항목 예상 합계 240 ~ 310만원',
    thumbnailSrc: floorKccImage,
    thumbnailAlt: '내추럴 우드 바닥재 패턴',
    tags: ['lowest-price', 'natural'],
    isAiRecommended: false,
    popularityRank: 2,
    priceRank: 1,
    summaryCostRows: [
      { label: '자재비', value: '160 ~ 200만원' },
      { label: '시공비', value: '80 ~ 110만원' },
    ],
    summaryDescription: '내추럴한 우드 톤으로 편안한 분위기를 연출해요.',
  },
  {
    id: 'floor-hyundai',
    category: 'floor',
    name: '현대L&C 명가 프리미엄',
    brandDetail: '현대L&C · 화이트 오크',
    materialCost: '자재비 210 ~ 250만원(3.3㎡ 기준 3,000원)',
    installationCost: '시공비 90 ~ 120만원',
    totalLabel: '항목 예상 합계 300 ~ 370만원',
    thumbnailSrc: floorHyundaiImage,
    thumbnailAlt: '화이트 오크 바닥재 패턴',
    tags: ['bright', 'modern'],
    isAiRecommended: false,
    popularityRank: 3,
    priceRank: 3,
    summaryCostRows: [
      { label: '자재비', value: '210 ~ 250만원' },
      { label: '시공비', value: '90 ~ 120만원' },
    ],
    summaryDescription: '밝은 오크 색상으로 공간을 넓고 깔끔하게 보여줘요.',
  },
]

export const wallpaperMaterialProducts: ReadonlyArray<MaterialProduct> = [
  {
    id: 'wallpaper-ai',
    category: 'wallpaper',
    name: '실크벽지 (베스띠)',
    brandDetail: 'LX하우시스 · 화이트 무지',
    materialCost: '자재비 50 ~ 80만원(필요 예상 수량 15롤)',
    installationCost: '시공비 20 ~ 30만원',
    totalLabel: '항목 예상 합계 70 ~ 110만원',
    thumbnailSrc: wallpaperAiImage,
    thumbnailAlt: '화이트 무지 실크벽지 패턴',
    tags: ['recommended', 'popular', 'bright', 'modern'],
    isAiRecommended: true,
    popularityRank: 1,
    priceRank: 2,
    summaryCostRows: [
      { label: '자재비', value: '50 ~ 80만원' },
      { label: '시공비', value: '20 ~ 30만원' },
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
    totalLabel: '항목 예상 합계 95 ~ 140만원',
    thumbnailSrc: wallpaperShinhanImage,
    thumbnailAlt: '웜그레이 벽지 패턴',
    tags: ['lowest-price', 'modern'],
    isAiRecommended: false,
    popularityRank: 2,
    priceRank: 1,
    summaryCostRows: [
      { label: '자재비', value: '45 ~ 70만원' },
      { label: '시공비', value: '50 ~ 70만원' },
    ],
    summaryDescription: '차분한 웜그레이 색상으로 공간에 안정감을 더해요.',
  },
  {
    id: 'wallpaper-gaenari',
    category: 'wallpaper',
    name: '개나리벽지 로하스',
    brandDetail: '개나리벽지 · 베이지 패턴',
    materialCost: '자재비 60 ~ 90만원(필요 예상 수량 15롤)',
    installationCost: '시공비 55 ~ 75만원',
    totalLabel: '항목 예상 합계 115 ~ 165만원',
    thumbnailSrc: wallpaperGaenariImage,
    thumbnailAlt: '베이지 패턴 벽지',
    tags: ['natural'],
    isAiRecommended: false,
    popularityRank: 3,
    priceRank: 3,
    summaryCostRows: [
      { label: '자재비', value: '60 ~ 90만원' },
      { label: '시공비', value: '55 ~ 75만원' },
    ],
    summaryDescription: '부드러운 베이지 톤으로 따뜻한 분위기를 연출해요.',
  },
]

export const lightingProducts: ReadonlyArray<LightingProduct> = [
  {
    id: 'lighting-ai',
    category: 'lighting',
    name: '슬림 LED 거실등 120W',
    brandDetail: '루미홈',
    materialCost: '자재 180,000원 · 철거 20,000원',
    installationCost: '인건비 50,000원',
    totalLabel: '항목 예상 합계 30 ~ 80만원',
    thumbnailSrc: lightingAiImage,
    thumbnailAlt: '슬림 LED 거실등',
    tags: ['recommended', 'modern'],
    isAiRecommended: true,
    popularityRank: 1,
    priceRank: 3,
    summaryCostRows: [
      { label: '자재비', value: '20 ~ 45만원' },
      { label: '시공비', value: '10 ~ 35만원' },
    ],
    summaryDescription: '공간의 선을 깔끔하게 살려줘요.',
    filterId: 'living-room',
    roomLabel: '거실 · 슬림 패널형',
    specification: '주광색 6500K · 120W',
    materialPriceLabel: '자재 180,000원',
    removalPriceLabel: '철거 20,000원',
    laborPriceLabel: '인건비 50,000원',
  },
  {
    id: 'lighting-bedroom',
    category: 'lighting',
    name: 'LED 방등 50W',
    brandDetail: '빛나조명',
    materialCost: '자재 65,000원 · 철거 10,000원',
    installationCost: '인건비 30,000원',
    totalLabel: '항목 예상 합계 9 ~ 18만원',
    thumbnailSrc: lightingAiImage,
    thumbnailAlt: 'LED 방등',
    tags: ['popular'],
    isAiRecommended: false,
    popularityRank: 2,
    priceRank: 1,
    summaryCostRows: [
      { label: '자재비', value: '6 ~ 10만원' },
      { label: '시공비', value: '3 ~ 8만원' },
    ],
    summaryDescription: '침실 전체에 부드럽고 균일한 확산광을 제공해요.',
    filterId: 'bedroom',
    roomLabel: '침실 · 원형 직부등',
    specification: '주백색 4000K · 50W',
    materialPriceLabel: '자재 65,000원',
    removalPriceLabel: '철거 10,000원',
    laborPriceLabel: '인건비 30,000원',
  },
  {
    id: 'lighting-kitchen',
    category: 'lighting',
    name: '엣지 주방등 60W',
    brandDetail: '라이팅랩',
    materialCost: '자재 85,000원 · 철거 10,000원',
    installationCost: '인건비 35,000원',
    totalLabel: '항목 예상 합계 12 ~ 22만원',
    thumbnailSrc: lightingAiImage,
    thumbnailAlt: '엣지 LED 주방등',
    tags: ['modern'],
    isAiRecommended: false,
    popularityRank: 3,
    priceRank: 2,
    summaryCostRows: [
      { label: '자재비', value: '8 ~ 12만원' },
      { label: '시공비', value: '4 ~ 10만원' },
    ],
    summaryDescription: '슬림한 구조로 공간을 깔끔하게 정돈해 보여요.',
    filterId: 'kitchen',
    roomLabel: '주방 · 엣지 패널형',
    specification: '주광색 6500K · 60W',
    materialPriceLabel: '자재 85,000원',
    removalPriceLabel: '철거 10,000원',
    laborPriceLabel: '인건비 35,000원',
  },
]

export const recommendedLightingProduct = lightingProducts[0]

export const defaultFloorMaterialId = floorMaterialProducts[0].id
export const defaultWallpaperMaterialId = wallpaperMaterialProducts[0].id
export const defaultLightingMaterialId = lightingProducts[0].id

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
    return copiedProducts.sort(
      (a, b) => Number(b.isAiRecommended) - Number(a.isAiRecommended),
    )
  }

  return copiedProducts.sort(
    (a, b) =>
      Number(b.tags.includes(filterId)) -
      Number(a.tags.includes(filterId)),
  )
}