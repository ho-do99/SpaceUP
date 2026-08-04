import floorPlanImage from '@/assets/user/images/floor-plan-preview.png'
import livingRoomImage from '@/assets/user/images/simulation-before.png'
import kitchenImage from '@/assets/user/images/simulation-upload-preview.png'
import bathroomImage from '@/assets/user/images/style-marble.png'
import entranceImage from '@/assets/user/images/style-modern.png'
import type { ContractorRequest, ContractorRequestDetail } from '@/types/contractorPortal'

export const contractorRequests: readonly ContractorRequest[] = [
  {
    requestId: 'REQ-260715-012',
    customerName: '김지선',
    maskedPhone: '010-12**-****',
    property: {
      region: '광주 서구',
      address: '광주 서구 ○○아파트 101동 1203호',
      propertyType: '아파트',
      areaLabel: '84㎡',
    },
    budgetLabel: '15,000,000원',
    estimatedCostLabel: '5,650,000원~7,750,000원',
    matchScore: 92,
    desiredSchedule: '2026년 8월',
    status: 'new',
    statusLabel: '신규',
    lastActivityLabel: '20분 전',
    deadlineLabel: 'D-7',
  },
  {
    requestId: 'REQ-260715-011',
    customerName: '이수민',
    maskedPhone: '010-34**-****',
    property: {
      region: '서울 마포구',
      address: '서울 마포구 아파트',
      propertyType: '아파트',
      areaLabel: '42㎡',
    },
    budgetLabel: '5,000,000원~10,000,000원',
    estimatedCostLabel: '6,200,000원~7,800,000원',
    matchScore: 88,
    desiredSchedule: '2026년 8월',
    status: 'reviewing',
    statusLabel: '검토 중',
    lastActivityLabel: '6일 전',
    deadlineLabel: 'D-1',
  },
  {
    requestId: 'REQ-260714-009',
    customerName: '박서준',
    maskedPhone: '010-56**-****',
    property: {
      region: '경기 성남시',
      address: '경기 성남시 아파트',
      propertyType: '아파트',
      areaLabel: '59㎡',
    },
    budgetLabel: '10,000,000원 이상',
    estimatedCostLabel: '12,000,000원~15,000,000원',
    matchScore: 85,
    desiredSchedule: '2026년 9월',
    status: 'auto_canceled',
    statusLabel: '자동 취소',
    lastActivityLabel: '168시간 미활동',
  },
]

export const contractorRequestDetails: readonly ContractorRequestDetail[] = [
  {
    ...contractorRequests[0],
    analysis: {
      rooms: 2,
      bathrooms: 1,
      hasBalcony: true,
      kitchenType: '분리형 주방',
      ceilingHeight: '2.3m',
    },
    selectedItems: ['바닥재', '벽지', '조명'],
    lightingNotice: '조명은 현장 실측 후 별도 협의 · 현재 견적 금액 미포함',
    valueIncrease: {
      currentMonthlyRent: '600,000원',
      expectedMonthlyIncrease: '200,000원/월',
      recoveryPeriod: '약 29개월~39개월',
    },
    floorPlanImage,
    photos: [
      { id: 'living-room', label: '거실', image: livingRoomImage },
      { id: 'kitchen', label: '주방', image: kitchenImage },
      { id: 'bathroom', label: '욕실', image: bathroomImage },
      { id: 'entrance', label: '현관', image: entranceImage },
    ],
  },
]

export function findContractorRequest(requestId: string | undefined) {
  return contractorRequests.find((request) => request.requestId === requestId)
}
export function findContractorRequestDetail(requestId: string | undefined) {
  return contractorRequestDetails.find((request) => request.requestId === requestId)
}
