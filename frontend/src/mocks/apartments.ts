import apartmentFloorPlan from '@/assets/user/images/apartment-floor-plan.png'

export interface ApartmentFloorPlanOption {
  id: string
  exclusiveArea: number
  supplyArea: number
  exclusivePyeong: number
  supplyPyeong: number
  typeLabel: string
  floorPlanAvailable: boolean
  floorPlanSrc: string
  floorPlanAlt: string
}

export interface ApartmentSearchResult {
  id: string
  apartmentName: string
  roadAddress: string
  lotAddress: string
  floorPlans: readonly ApartmentFloorPlanOption[]
}

const apartmentFloorPlans: readonly ApartmentFloorPlanOption[] = [
  {
    id: 'exclusive-59',
    exclusiveArea: 59,
    supplyArea: 84,
    exclusivePyeong: 18,
    supplyPyeong: 25,
    typeLabel: '기본형',
    floorPlanAvailable: true,
    floorPlanSrc: apartmentFloorPlan,
    floorPlanAlt: '전용 59제곱미터 아파트 기본형 평면도',
  },
  {
    id: 'exclusive-74',
    exclusiveArea: 74,
    supplyArea: 99,
    exclusivePyeong: 22,
    supplyPyeong: 30,
    typeLabel: '기본형',
    floorPlanAvailable: true,
    floorPlanSrc: apartmentFloorPlan,
    floorPlanAlt: '전용 74제곱미터 아파트 기본형 평면도',
  },
  {
    id: 'exclusive-84',
    exclusiveArea: 84,
    supplyArea: 112,
    exclusivePyeong: 25,
    supplyPyeong: 34,
    typeLabel: '기본형',
    floorPlanAvailable: true,
    floorPlanSrc: apartmentFloorPlan,
    floorPlanAlt: '전용 84제곱미터 아파트 기본형 평면도',
  },
]

export const apartmentSearchResults: readonly ApartmentSearchResult[] = [
  {
    id: 'sangmu-central-apartment',
    apartmentName: '상무센트럴아파트',
    roadAddress: '광주광역시 서구 상무중앙로 100',
    lotAddress: '광주광역시 서구 치평동 1234',
    floorPlans: apartmentFloorPlans,
  },
  {
    id: 'sangmu-riverview-apartment',
    apartmentName: '상무리버뷰아파트',
    roadAddress: '광주광역시 서구 상무대로 200',
    lotAddress: '광주광역시 서구 쌍촌동 567',
    floorPlans: apartmentFloorPlans,
  },
  {
    id: 'sangmu-sky-apartment',
    apartmentName: '상무스카이아파트',
    roadAddress: '광주광역시 서구 시청로 50',
    lotAddress: '광주광역시 서구 치평동 890',
    floorPlans: apartmentFloorPlans,
  },
]
